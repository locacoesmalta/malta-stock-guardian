import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AssetScanner() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scannerActive) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          setScannedCode(decodedText);
          toast.success("QR Code detectado!");
          scanner?.clear();
          setScannerActive(false);
          searchAsset(decodedText);
        },
        (error) => {
          // QR Code scan error - silently handled
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scannerActive]);

  const searchAsset = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_code", code)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        navigate(`/assets/edit/${data.id}`);
      } else {
        toast.info("Patrimônio não encontrado. Você pode cadastrá-lo.");
        navigate(`/assets/new?code=${code}`);
      }
    } catch (error) {
      console.error("Erro ao buscar patrimônio:", error);
      toast.error("Erro ao buscar patrimônio");
    }
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      toast.error("Digite um código válido");
      return;
    }
    searchAsset(manualCode);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/assets")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Buscar por Código</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">Digite o código do patrimônio</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: PAT001"
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                />
                <Button onClick={handleManualSearch}>Buscar</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Escanear QR Code</h2>
          
          {!scannerActive ? (
            <Button
              onClick={() => setScannerActive(true)}
              className="w-full"
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Ativar Câmera
            </Button>
          ) : (
            <div className="space-y-4">
              <div
                id="qr-reader"
                className="w-full rounded-lg overflow-hidden"
              />
              <Button
                onClick={() => setScannerActive(false)}
                variant="outline"
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          )}

          {scannedCode && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Código detectado:</p>
              <p className="font-mono font-bold">{scannedCode}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
