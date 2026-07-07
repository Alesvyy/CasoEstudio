package services;

import io.restassured.response.Response;
import static io.restassured.RestAssured.given;

public class UsuarioService {

    public Response getAll() {
        return given().get("/usuarios");
    }

    public Response post(String body) {
        return given().header("Content-Type", "application/json").body(body).post("/usuarios");
    }

    public Response put(String id, String body) {
        return given().header("Content-Type", "application/json").body(body).put("/usuarios/" + id);
    }

    public Response delete(String id) {
        return given().delete("/usuarios/" + id);
    }

    public Response login(String body) {
        return given().header("Content-Type", "application/json").body(body).post("/usuarios/login");
    }
}