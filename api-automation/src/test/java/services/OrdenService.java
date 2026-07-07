package services;

import io.restassured.response.Response;
import static io.restassured.RestAssured.given;

public class OrdenService {

    public Response getAll() {
        return given().get("/ordenes");
    }

    public Response post(String body) {
        return given().header("Content-Type", "application/json").body(body).post("/ordenes");
    }

    public Response put(String id, String body) {
        return given().header("Content-Type", "application/json").body(body).put("/ordenes/" + id);
    }

    public Response delete(String id) {
        return given().delete("/ordenes/" + id);
    }
}