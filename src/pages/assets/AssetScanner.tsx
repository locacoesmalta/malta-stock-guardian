import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Search, History, ScanLine, Zap, AlertCircle, CheckCircle2, Loader2, FlashlightIcon, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPAT } from "@/lib/patUtils";

interface ScanHistory {
  code: string;
  timestamp: Date;
  assetName?: string;
}

type PermissionState = "prompt" | "granted" | "denied" | "checking";
type ScannerState = "idle" | "initializing" | "active" | "error";

export default function AssetScanner() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Carregar histórico do localStorage ao montar
  useEffect(() => {
    const savedHistory = localStorage.getItem("scan_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setScanHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      }
    }
  }, []);

  // Salvar histórico no localStorage quando mudar
  useEffect(() => {
    if (scanHistory.length > 0) {
      localStorage.setItem("scan_history", JSON.stringify(scanHistory));
    }
  }, [scanHistory]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        stopScanner();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const requestCameraPermission = async (): Promise<boolean> => {
    setPermissionState("checking");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      });
      
      // Fechar o stream imediatamente - só queremos verificar permissões
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      return true;
    } catch (error: any) {
      console.error("Erro ao solicitar permissão da câmera:", error);
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionState("denied");
        toast.error("Permissão da câmera negada. Por favor, habilite nas configurações do navegador.", {
          duration: 5000
        });
      } else if (error.name === "NotFoundError") {
        toast.error("Nenhuma câmera encontrada no dispositivo.");
        setPermissionState("denied");
      } else {
        toast.error("Erro ao acessar a câmera: " + error.message);
        setPermissionState("denied");
      }
      
      return false;
    }
  };

  const startScanner = async () => {
    if (scannerState !== "idle") return;
    
    setScannerState("initializing");
    
    // Solicitar permissão explicitamente
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setScannerState("idle");
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: isMobile ? 10 : 15,
        qrbox: isMobile 
          ? { width: Math.min(250, window.innerWidth - 80), height: Math.min(250, window.innerWidth - 80) }
          : { width: 300, height: 300 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await html5QrCode.start(
        { facingMode },
        config,
        (decodedText) => {
          setScannedCode(decodedText);
          toast.success("QR Code detectado!", {
            icon: <CheckCircle2 className="h-4 w-4" />,
            description: "Buscando patrimônio..."
          });
          
          // Vibração se disponível
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          
          stopScanner();
          searchAsset(decodedText);
        },
        undefined
      );

      setScannerState("active");
      toast.success("Câmera ativada! Aponte para o QR Code", {
        icon: <Camera className="h-4 w-4" />
      });
      
    } catch (error: any) {
      console.error("Erro ao iniciar scanner:", error);
      setScannerState("error");
      toast.error("Erro ao iniciar scanner: " + error.message);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (error) {
        console.error("Erro ao parar scanner:", error);
      }
      html5QrCodeRef.current = null;
    }
    setScannerState("idle");
    setTorchEnabled(false);
  };

  const toggleCamera = async () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);
    
    if (scannerState === "active") {
      await stopScanner();
      // Pequeno delay para garantir limpeza
      setTimeout(() => startScanner(), 100);
    }
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && scannerState === "active") {
      try {
        const track = await html5QrCodeRef.current.getRunningTrackCameraCapabilities();
        // Verificar se torch está disponível (type assertion segura)
        if ((track as any).torch) {
          await html5QrCodeRef.current.applyVideoConstraints({
            advanced: [{ torch: !torchEnabled } as any]
          } as any);
          setTorchEnabled(!torchEnabled);
          toast.success(torchEnabled ? "Lanterna desligada" : "Lanterna ligada");
        } else {
          toast.info("Lanterna não disponível neste dispositivo");
        }
      } catch (error) {
        console.error("Erro ao alternar lanterna:", error);
        toast.info("Lanterna não disponível neste dispositivo");
      }
    }
  };

  const addToHistory = useCallback((code: string, assetName?: string) => {
    const newEntry: ScanHistory = {
      code,
      timestamp: new Date(),
      assetName
    };
    
    setScanHistory(prev => {
      const filtered = prev.filter(item => item.code !== code);
      return [newEntry, ...filtered].slice(0, 10); // Aumentado para 10 itens
    });
  }, []);

  const searchAsset = useCallback(async (code: string) => {
    // Debounce para evitar múltiplas buscas
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const formattedCode = formatPAT(code) || code;
        
        const { data, error } = await supabase
          .from("assets")
          .select("id, asset_code, equipment_name")
          .eq("asset_code", formattedCode)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          addToHistory(formattedCode, data.equipment_name);
          toast.success(`Patrimônio encontrado: ${data.equipment_name}`, {
            icon: <Zap className="h-4 w-4" />
          });
          navigate(`/assets/view/${data.id}`);
        } else {
          addToHistory(formattedCode);
          toast.info("Patrimônio não encontrado. Deseja cadastrá-lo?");
          navigate(`/assets/new?code=${formattedCode}`);
        }
      } catch (error) {
        console.error("Erro ao buscar patrimônio:", error);
        toast.error("Erro ao buscar patrimônio");
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [navigate]);

  const handleManualSearch = useCallback(() => {
    if (!manualCode.trim()) {
      toast.error("Digite um código válido");
      return;
    }
    searchAsset(manualCode);
  }, [manualCode, searchAsset]);

  const clearHistory = useCallback(() => {
    setScanHistory([]);
    localStorage.removeItem("scan_history");
    toast.success("Histórico limpo");
  }, []);

  const getScannerStatusBadge = () => {
    switch (scannerState) {
      case "initializing":
        return (
          <Badge variant="outline" className="gap-2 bg-yellow-500/10 border-yellow-500/20">
            <Loader2 className="h-3 w-3 animate-spin" />
            Inicializando...
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="gap-2 bg-green-500/10 border-green-500/20 animate-pulse">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Câmera Ativa
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="gap-2 bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-3 w-3 text-red-500" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-2">
            <ScanLine className="h-3 w-3" />
            Pronto
          </Badge>
        );
    }
  };

  const getPermissionMessage = () => {
    switch (permissionState) {
      case "checking":
        return (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Solicitando permissão da câmera...</span>
          </div>
        );
      case "denied":
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-red-600 dark:text-red-500">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Permissão da câmera negada</p>
                <p className="text-sm mt-1">Para usar o scanner, permita o acesso à câmera nas configurações do navegador.</p>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
              <p className="font-semibold">Como habilitar:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Clique no ícone de cadeado/câmera na barra de endereço</li>
                <li>Selecione "Permitir" para câmera</li>
                <li>Recarregue a página</li>
              </ol>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/assets")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-2">
          {getScannerStatusBadge()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Scanner e Busca */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Busca Manual */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Busca Rápida</h2>
                <p className="text-sm text-muted-foreground">Digite o código PAT</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-code" className="text-base">
                  Código do Patrimônio (6 dígitos)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-code"
                    type="text"
                    value={manualCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        setManualCode(value);
                      }
                    }}
                    onBlur={() => {
                      if (manualCode) {
                        const formatted = formatPAT(manualCode);
                        if (formatted) {
                          setManualCode(formatted);
                        }
                      }
                    }}
                    placeholder="000000"
                    maxLength={6}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    className="font-mono text-lg"
                    disabled={isSearching}
                  />
                  <Button 
                    onClick={handleManualSearch} 
                    size="lg"
                    disabled={isSearching || !manualCode.trim()}
                  >
                    {isSearching ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Card do Scanner QR */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Scanner QR Code</h2>
                <p className="text-sm text-muted-foreground">
                  {scannerState === "active" ? "Alinhe o QR Code no centro" : "Escaneie códigos rapidamente"}
                </p>
              </div>
            </div>
            
            {permissionState === "denied" && (
              <div className="mb-4">
                {getPermissionMessage()}
              </div>
            )}
            
            {scannerState === "idle" ? (
              <div className="space-y-3">
                <Button
                  onClick={startScanner}
                  className="w-full h-14"
                  size="lg"
                  disabled={permissionState === "checking"}
                >
                  {permissionState === "checking" ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Solicitando Permissão...
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5 mr-2" />
                      Ativar Câmera
                    </>
                  )}
                </Button>
                
                {isMobile && (
                  <p className="text-xs text-center text-muted-foreground">
                    💡 Dica: Posicione o QR Code a cerca de 15cm da câmera
                  </p>
                )}
              </div>
            ) : scannerState === "initializing" ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-semibold">Inicializando câmera...</p>
                  <p className="text-sm text-muted-foreground mt-2">Aguarde um momento</p>
                </div>
              </div>
            ) : scannerState === "active" ? (
              <div className="space-y-4">
                <div className="relative">
                  <div
                    id="qr-reader"
                    className="w-full rounded-lg overflow-hidden border-4 border-primary/30 shadow-lg"
                  />
                  
                  {/* Overlay de guia visual */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Cantos do quadrado guia */}
                      <div className="absolute top-[20%] left-[20%] w-8 h-8 border-t-4 border-l-4 border-primary/80 rounded-tl-lg" />
                      <div className="absolute top-[20%] right-[20%] w-8 h-8 border-t-4 border-r-4 border-primary/80 rounded-tr-lg" />
                      <div className="absolute bottom-[20%] left-[20%] w-8 h-8 border-b-4 border-l-4 border-primary/80 rounded-bl-lg" />
                      <div className="absolute bottom-[20%] right-[20%] w-8 h-8 border-b-4 border-r-4 border-primary/80 rounded-br-lg" />
                    </div>
                  </div>
                  
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                    <Badge className="bg-green-500/90 backdrop-blur-sm shadow-lg">
                      <ScanLine className="h-3 w-3 mr-1 animate-pulse" />
                      Escaneando
                    </Badge>
                    
                    <div className="flex gap-2">
                      {isMobile && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm shadow-lg"
                          onClick={toggleCamera}
                        >
                          <SwitchCamera className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-background/80 backdrop-blur-sm shadow-lg"
                        onClick={toggleTorch}
                      >
                        <FlashlightIcon className={`h-4 w-4 ${torchEnabled ? "text-yellow-500" : ""}`} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 text-center shadow-lg">
                      <p className="text-xs font-medium">Alinhe o QR Code dentro do quadrado</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={stopScanner}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Cancelar Scanner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-lg font-semibold">Erro ao iniciar scanner</p>
                  <p className="text-sm text-muted-foreground mt-2">Verifique as permissões da câmera</p>
                </div>
                <Button
                  onClick={() => {
                    setScannerState("idle");
                    setPermissionState("prompt");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Tentar Novamente
                </Button>
              </div>
            )}

            {scannedCode && (
              <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm text-muted-foreground mb-1">Último código detectado:</p>
                <p className="font-mono font-bold text-lg text-primary">{scannedCode}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Coluna Lateral - Histórico */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-bold">Histórico Recente</h3>
              </div>
              {scanHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-8 text-xs"
                >
                  Limpar
                </Button>
              )}
            </div>

            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhum escaneamento ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scanHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => searchAsset(item.code)}
                    className="w-full p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">
                          {item.code}
                        </p>
                        {item.assetName && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {item.assetName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
