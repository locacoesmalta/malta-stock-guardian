import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let timeoutId: NodeJS.Timeout;

    const startScanner = async () => {
      try {
        // Espera o elemento estar disponível no DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mountedRef.current) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!mountedRef.current) return;
            
            // Formata o PAT com 6 dígitos se for numérico
            const formatted = /^\d+$/.test(decodedText) 
              ? decodedText.padStart(6, "0") 
              : decodedText;
            
            onScan(formatted);
            handleClose();
          },
          undefined
        );

        if (mountedRef.current) {
          setIsScanning(true);
        }
      } catch (error) {
        console.error("Erro ao iniciar scanner:", error);
        if (mountedRef.current) {
          toast.error("Erro ao acessar a câmera. Verifique as permissões.");
          onClose();
        }
      }
    };

    // Timeout de segurança para evitar travamentos
    timeoutId = setTimeout(() => {
      if (!isScanning && mountedRef.current) {
        toast.error("Tempo limite excedido ao iniciar câmera");
        onClose();
      }
    }, 10000);

    startScanner();

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          })
          .catch((err) => {
            console.error("Erro ao parar scanner:", err);
          });
      }
    };
  }, []);

  const handleClose = () => {
    mountedRef.current = false;
    
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          onClose();
        })
        .catch((err) => {
          console.error("Erro ao fechar scanner:", err);
          onClose();
        });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Escanear QR Code</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex flex-col items-center justify-center p-4 h-[calc(100vh-80px)]">
        <div id="qr-reader" className="w-full max-w-md"></div>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Posicione o QR Code dentro da moldura
        </p>
      </div>
    </div>
  );
};
