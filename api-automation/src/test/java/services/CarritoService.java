package services;

import io.restassured.response.Response;
import static io.restassured.RestAssured.given;

public class CarritoService {

    public Response getAll() {
        return given().get("/carritos");
    }

    public Response post(String body) {
        return given().header("Content-Type", "application/json").body(body).post("/carritos");
    }

    public Response put(String id, String body) {
        return given().header("Content-Type", "application/json").body(body).put("/carritos/" + id);
    }

    public Response delete(String id) {
        return given().delete("/carritos/" + id);
    }
}