package services;

import io.restassured.response.Response;
import static io.restassured.RestAssured.given;

public class CategoriaService {

    public Response getAll() {
        return given().get("/categorias");
    }

    public Response post(String body) {
        return given().header("Content-Type", "application/json").body(body).post("/categorias");
    }

    public Response put(String id, String body) {
        return given().header("Content-Type", "application/json").body(body).put("/categorias/" + id);
    }

    public Response delete(String id) {
        return given().delete("/categorias/" + id);
    }
}