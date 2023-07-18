import { ToastContext } from "@/components/Toast";
import { useContext } from "react";

export function useToast() {
    const setToast = useContext(ToastContext);
    return setToast;
}