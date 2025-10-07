import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Search, History, ScanLine, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPAT } from "@/lib/patUtils";

interface ScanHistory {
  code: string;
  timestamp: Date;
  assetName?: string;
}

export default function AssetScanner() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scannerActive) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          setScannedCode(decodedText);
          toast.success("QR Code detectado com sucesso!", {
            icon: <ScanLine className="h-4 w-4" />
          });
          scanner?.clear();
          setScannerActive(false);
          searchAsset(decodedText);
        },
        (error) => {
          // Ignorar erros de scanning contínuo
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scannerActive]);

  const addToHistory = (code: string, assetName?: string) => {
    const newEntry: ScanHistory = {
      code,
      timestamp: new Date(),
      assetName
    };
    
    setScanHistory(prev => {
      const filtered = prev.filter(item => item.code !== code);
      return [newEntry, ...filtered].slice(0, 5); // Manter apenas os 5 mais recentes
    });
  };

  const searchAsset = async (code: string) => {
    setIsSearching(true);
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
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      toast.error("Digite um código válido");
      return;
    }
    searchAsset(manualCode);
  };

  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem("scan_history");
    toast.success("Histórico limpo");
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
          <Badge variant="outline" className="gap-2">
            <ScanLine className="h-3 w-3" />
            Scanner Ativo
          </Badge>
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
              <div>
                <h2 className="text-xl font-bold">Scanner QR Code</h2>
                <p className="text-sm text-muted-foreground">
                  {scannerActive ? "Aponte para o QR Code" : "Escaneie códigos rapidamente"}
                </p>
              </div>
            </div>
            
            {!scannerActive ? (
              <Button
                onClick={() => setScannerActive(true)}
                className="w-full h-14"
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Ativar Câmera
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div
                    id="qr-reader"
                    className="w-full rounded-lg overflow-hidden border-4 border-primary/30"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 animate-pulse">
                      Escaneando...
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => setScannerActive(false)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Cancelar Scanner
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
