// features/auth/types/index.ts
// Tipos específicos del feature auth. UsuarioRead y UsuarioCreate se movieron a shared/types/
// porque son usados por múltiples features (FSD: sin cross-imports entre features).

export interface LoginInput {
    email: string;
    password: string;
}