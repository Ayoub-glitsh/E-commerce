import { http, HttpResponse } from "msw";
import { categories, products } from "./data";

export const handlers = [

    http.get("/api/categories", () => {
        return HttpResponse.json(categories);
    }),

    http.get("/api/products", () => {
        return HttpResponse.json(products);
    }),
 
];