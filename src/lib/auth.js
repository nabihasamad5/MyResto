import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = String(credentials?.email || "").trim();
                const password = String(credentials?.password || "");
                if (!email || !password) return null;

                const [rows] = await db.execute(
                    "SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = ? LIMIT 1",
                    [email]
                );
                const user = Array.isArray(rows) ? rows[0] : null;
                if (!user) return null;
                if (Number(user?.is_active) === 0) return null;

                const hash = user.password_hash;
                let ok = false;
                if (hash && String(hash).startsWith("$2")) {
                    ok = await bcrypt.compare(password, hash);
                } else if (hash) {
                    ok = password === hash;
                }
                if (!ok) return null;

                return { id: String(user.id), name: user.name, email: user.email, role: user.role };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.role = token.role;
            session.user.id = token.id;
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/signin",
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "secret",
    debug: process.env.NODE_ENV !== "production",
};
