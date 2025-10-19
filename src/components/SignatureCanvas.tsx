import { useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface SignatureCanvasProps {
  value?: string;
  onChange: (signature: string) => void;
  disabled?: boolean;
}

export const SignaturePad = ({ value, onChange, disabled }: SignatureCanvasProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (value && sigCanvas.current && sigCanvas.current.isEmpty()) {
      sigCanvas.current.fromDataURL(value);
    }
  }, [value]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onChange("");
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.toDataURL();
      onChange(dataURL);
    }
  };

  return (
    <div className="space-y-2">
      <div 
        className={`border-2 border-dashed border-muted-foreground/30 rounded-md bg-white relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: "w-full h-[200px] touch-none",
            style: { touchAction: 'none' }
          }}
          backgroundColor="rgb(255, 255, 255)"
          onEnd={handleEnd}
        />
        <div className="absolute bottom-2 left-0 right-0 border-t border-muted-foreground/30 mx-4 pt-2">
          <p className="text-xs text-center text-muted-foreground">Assinatura do Cliente</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClear}
        disabled={disabled}
        className="w-full"
      >
        <Eraser className="h-4 w-4 mr-2" />
        Limpar Assinatura
      </Button>
    </div>
  );
};
