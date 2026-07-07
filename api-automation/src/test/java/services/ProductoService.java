package services;

import io.restassured.response.Response;
import static io.restassured.RestAssured.given;

public class ProductoService {

    public Response getAll() {
        return given().get("/productos");
    }

    public Response post(String body) {
        return given().header("Content-Type", "application/json").body(body).post("/productos");
    }

    public Response put(String id, String body) {
        return given().header("Content-Type", "application/json").body(body).put("/productos/" + id);
    }

    public Response delete(String id) {
        return given().delete("/productos/" + id);
    }
}