import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

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
    
    // Verificar se mediaDevices está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Seu navegador não suporta acesso à câmera", {
        description: "Por favor, use um navegador mais recente ou verifique as configurações de segurança."
      });
      setPermissionState("denied");
      return false;
    }
    
    try {
      console.log("[Scanner] Solicitando permissão da câmera...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log("[Scanner] Permissão concedida, fechando stream de teste");
      // Fechar o stream imediatamente - só queremos verificar permissões
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      return true;
    } catch (error: any) {
      console.error("[Scanner] Erro ao solicitar permissão da câmera:", error);
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionState("denied");
        toast.error("Permissão da câmera negada", {
          description: "Por favor, habilite o acesso à câmera nas configurações do navegador.",
          duration: 5000
        });
      } else if (error.name === "NotFoundError") {
        toast.error("Nenhuma câmera encontrada no dispositivo.");
        setPermissionState("denied");
      } else if (error.name === "NotReadableError" || error.name === "AbortError") {
        toast.error("Câmera já está em uso", {
          description: "Feche outros aplicativos que possam estar usando a câmera."
        });
        setPermissionState("denied");
      } else {
        toast.error("Erro ao acessar a câmera: " + error.message);
        setPermissionState("denied");
      }
      
      return false;
    }
  };

  // Aguardar o elemento estar no DOM
  const waitForElement = async (id: string, maxAttempts = 20): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`[Scanner] Tentativa ${i + 1}/${maxAttempts} de encontrar elemento #${id}`);
      const element = document.getElementById(id);
      if (element) {
        console.log(`[Scanner] Elemento #${id} encontrado!`);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    console.error(`[Scanner] Elemento #${id} não encontrado após ${maxAttempts} tentativas`);
    return false;
  };

  const startScanner = async () => {
    if (scannerState !== "idle" && scannerState !== "error") {
      console.log("[Scanner] Scanner já está ativo ou inicializando");
      return;
    }
    
    console.log("[Scanner] Iniciando scanner...");
    setScannerState("initializing");
    retryCountRef.current = 0;
    
    // Solicitar permissão explicitamente
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.log("[Scanner] Permissão não concedida");
      setScannerState("idle");
      return;
    }

    try {
      // Aguardar o elemento estar disponível no DOM
      console.log("[Scanner] Aguardando elemento #qr-reader...");
      const elementFound = await waitForElement("qr-reader");
      
      if (!elementFound) {
        throw new Error("Elemento #qr-reader não encontrado no DOM após múltiplas tentativas");
      }

      console.log("[Scanner] Criando instância Html5Qrcode...");
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: isMobile ? 5 : 10,
        qrbox: isMobile 
          ? { 
              width: Math.min(200, window.innerWidth * 0.7), 
              height: Math.min(200, window.innerWidth * 0.7) 
            }
          : { width: 300, height: 300 },
        aspectRatio: 1.0,
        disableFlip: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        videoConstraints: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log("[Scanner] Iniciando câmera com config:", config);
      await html5QrCode.start(
        { facingMode },
        config,
        (decodedText, decodedResult) => {
          console.log("[Scanner] Código detectado:", decodedText, "Formato:", decodedResult.result.format);
          setScannedCode(decodedText);
          toast.success("Código detectado!", {
            icon: <CheckCircle2 className="h-4 w-4" />,
            description: `Formato: ${decodedResult.result.format?.formatName || "QR Code"}`
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

      console.log("[Scanner] Câmera iniciada com sucesso!");
      setScannerState("active");
      retryCountRef.current = 0;
      toast.success("Câmera ativada!", {
        icon: <Camera className="h-4 w-4" />,
        description: "Aponte para o QR Code ou código de barras"
      });
      
    } catch (error: any) {
      console.error("[Scanner] Erro ao iniciar scanner:", error);
      setScannerState("error");
      
      // Retry automático se não exceder o máximo
      if (retryCountRef.current < MAX_RETRIES && error.message.includes("qr-reader")) {
        retryCountRef.current++;
        toast.error(`Tentativa ${retryCountRef.current}/${MAX_RETRIES}...`, {
          description: "Tentando novamente em 2 segundos"
        });
        setTimeout(() => startScanner(), 2000);
      } else {
        toast.error("Erro ao iniciar scanner", {
          description: error.message,
          action: {
            label: "Tentar Novamente",
            onClick: () => {
              setScannerState("idle");
              retryCountRef.current = 0;
            }
          }
        });
      }
    }
  };

  const stopScanner = async () => {
    console.log("[Scanner] Parando scanner...");
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        console.log("[Scanner] Estado atual:", state);
        
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          console.log("[Scanner] Parando scanner ativo...");
          await html5QrCodeRef.current.stop();
        }
        
        // Aguardar um pouco antes de limpar
        await new Promise(resolve => setTimeout(resolve, 100));
        html5QrCodeRef.current.clear();
        console.log("[Scanner] Scanner limpo com sucesso");
      } catch (error) {
        console.error("[Scanner] Erro ao parar scanner:", error);
        // Forçar limpeza mesmo com erro
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.error("[Scanner] Erro ao limpar scanner:", e);
        }
      }
      html5QrCodeRef.current = null;
    }
    setScannerState("idle");
    setTorchEnabled(false);
    retryCountRef.current = 0;
  };

  const toggleCamera = async () => {
    console.log("[Scanner] Alternando câmera...");
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);
    
    if (scannerState === "active") {
      await stopScanner();
      // Delay maior para garantir limpeza completa
      setTimeout(() => startScanner(), 500);
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
          toast.info("Patrimônio não cadastrado", {
            description: "Você será direcionado para o cadastro",
          });
          
          // Pequeno delay para o usuário ler a mensagem
          setTimeout(() => {
            navigate(`/assets/register?code=${formattedCode}`);
          }, 1000);
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
            
            {/* Elemento do scanner - sempre renderizado mas controlado por visibilidade */}
            <div className={scannerState === "active" ? "block" : "hidden"}>
              <div className="space-y-4">
                <div className="relative">
                  <div
                    id="qr-reader"
                    ref={qrReaderRef}
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
                      <p className="text-xs font-medium">Alinhe o código dentro do quadrado</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={stopScanner}
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Parar Scanner
                </Button>
              </div>
            </div>
            
            {/* Estados do scanner */}
            {scannerState === "idle" && (
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
                    💡 Dica: Posicione o código a cerca de 15cm da câmera
                  </p>
                )}
              </div>
            )}
            
            {scannerState === "initializing" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-semibold">Inicializando câmera...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aguarde enquanto preparamos o scanner
                  </p>
                </div>
              </div>
            )}
            
            {scannerState === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-lg font-semibold text-destructive">Erro ao iniciar scanner</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Verifique se a câmera está disponível e tente novamente
                  </p>
                  <Button
                    onClick={() => {
                      setScannerState("idle");
                      retryCountRef.current = 0;
                    }}
                    className="mt-4"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
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
