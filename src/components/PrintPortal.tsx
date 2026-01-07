import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PrintPortalProps {
  children: ReactNode;
  onAfterPrint?: () => void;
}

/**
 * Portal que renderiza conteúdo diretamente em #print-root (fora do #root).
 * Isso garante que a impressão funcione independente de CSS/layout da aplicação.
 */
export const PrintPortal = ({ children, onAfterPrint }: PrintPortalProps) => {
  const printRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    printRootRef.current = document.getElementById("print-root");
    
    const handleAfterPrint = () => {
      console.log("[PRINT_PORTAL] afterprint event fired");
      onAfterPrint?.();
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [onAfterPrint]);

  if (!printRootRef.current) {
    // Fallback: criar o elemento se não existir
    let el = document.getElementById("print-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "print-root";
      document.body.appendChild(el);
    }
    printRootRef.current = el;
  }

  return createPortal(children, printRootRef.current);
};

/**
 * Hook utilitário para disparar impressão com logs de diagnóstico
 */
export const usePrintWithDiagnostics = () => {
  const triggerPrint = () => {
    // Diagnóstico antes de imprimir
    const printRoot = document.getElementById("print-root");
    const wrapper = printRoot?.querySelector(".print-assets-wrapper");
    
    console.log("[PRINT_DIAG] beforeprint check:", {
      printRootExists: !!printRoot,
      printRootChildren: printRoot?.children.length,
      wrapperExists: !!wrapper,
      wrapperDisplay: wrapper ? getComputedStyle(wrapper).display : "N/A",
      wrapperVisibility: wrapper ? getComputedStyle(wrapper).visibility : "N/A",
    });

    // Aguardar render completo antes de imprimir
    requestAnimationFrame(() => {
      setTimeout(() => {
        console.log("[PRINT_DIAG] Calling window.print()");
        window.print();
      }, 100);
    });
  };

  return { triggerPrint };
};
