import type { Metadata } from "next";
import { ResetPassword } from "@/components/onboarding/ResetPassword";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

// El middleware exige sesión (el enlace del correo la crea vía /auth/callback).
export default function RestablecerPage() {
  return <ResetPassword />;
}
