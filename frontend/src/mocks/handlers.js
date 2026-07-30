import { http, HttpResponse } from "msw";
import { categories, products, orders, users } from "./data";

export const handlers = [

    http.get("/api/categories", () => {
        return HttpResponse.json(categories);
    }),

    http.get("/api/products", () => {
        return HttpResponse.json(products);
    }),

    http.get('/api/orders', () => {
        return HttpResponse.json(orders);
    }),

    // REGISTER
    http.post('/api/auth/register', async ({ request }) => {
        const { name, email, password } = await request.json();
        const exists = users.find(u => u.email === email);
        if (exists) {
            return HttpResponse.json(
                { message: "Cet email est déjà utilisé." },
                { status: 409 }
            );
        }
        const newUser = { id: users.length + 1, name, email, password };
        users.push(newUser);
        const token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ id: newUser.id, email })) + '.mock-signature';
        return HttpResponse.json({
            user: { id: newUser.id, name, email },
            token
        });
    }),

    // LOGIN
    http.post('/api/auth/login', async ({ request }) => {
        const { email, password } = await request.json();
        const user = users.find(u => u.email === email);
        if (!user) {
            return HttpResponse.json(
                { message: "Aucun compte trouvé avec cet email." },
                { status: 401 }
            );
        }
        if (user.password !== password) {
            return HttpResponse.json(
                { message: "Mot de passe incorrect." },
                { status: 401 }
            );
        }
        const token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ id: user.id, email })) + '.mock-signature';
        return HttpResponse.json({
            user: { id: user.id, name: user.name, email: user.email },
            token
        });
    }),
];