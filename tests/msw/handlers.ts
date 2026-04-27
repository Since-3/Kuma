import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("http://localhost/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.email || !body.password) {
      return HttpResponse.json({ error: "E-Mail und Passwort sind erforderlich" }, { status: 400 });
    }

    if (body.email === "wrong@example.com") {
      return HttpResponse.json({ error: "E-Mail oder Passwort ist falsch" }, { status: 401 });
    }

    return HttpResponse.json(
      {
        user: { id: "user-1", email: body.email },
        session: { access_token: "token-123" },
      },
      { status: 200 }
    );
  }),

  http.post("http://localhost/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    if (body.email === "existing@example.com") {
      return HttpResponse.json({ error: "Dieser Nutzer existiert bereits." }, { status: 409 });
    }

    return HttpResponse.json(
      { user: { id: "new-user-1", email: body.email, name: body.name } },
      { status: 201 }
    );
  }),

  http.post("http://localhost/api/auth/register/employee", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.token || !body.email || !body.password || !body.firstName || !body.lastName) {
      return HttpResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    if (body.token === "expired-token") {
      return HttpResponse.json({ error: "Token abgelaufen" }, { status: 401 });
    }

    if (body.token === "invalid-token") {
      return HttpResponse.json({ error: "Ungültiger Token" }, { status: 401 });
    }

    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  http.post("http://localhost/api/upload/avatar", async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file");
    const token = formData.get("token");

    if (!file || !token) {
      return HttpResponse.json({ error: "Datei und Token erforderlich" }, { status: 400 });
    }

    if (token === "invalid-token") {
      return HttpResponse.json({ error: "Ungültiger Token" }, { status: 401 });
    }

    return HttpResponse.json(
      { publicUrl: "https://example.com/avatars/employee-1/avatar.jpg" },
      { status: 201 }
    );
  }),
];
