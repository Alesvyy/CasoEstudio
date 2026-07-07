package tests;

import base.BaseTest;
import data.TestData;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;
import services.CarritoService;

public class CarritoTest extends BaseTest {

    private final CarritoService service = new CarritoService();

    @Test(priority = 1)
    public void getCarritos() {
        Response response = service.getAll();
        Assert.assertEquals(response.statusCode(), 200);
    }

    @Test(priority = 2)
    public void postCarritoValido() {
        String body = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 2
            }
          ]
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response response = service.post(body);
        Assert.assertEquals(response.statusCode(), 201);
        Assert.assertNotNull(response.jsonPath().getString("_id"));
    }

    @Test(priority = 3)
    public void postCarritoInvalido() {
        String body = """
        {
          "productos": []
        }
        """;

        Response response = service.post(body);
        Assert.assertTrue(response.statusCode() >= 400);
    }

    @Test(priority = 4)
    public void putCarrito() {
        String bodyCrear = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 1
            }
          ]
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response creado = service.post(bodyCrear);
        String id = creado.jsonPath().getString("_id");

        String bodyActualizar = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 3
            }
          ]
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response response = service.put(id, bodyActualizar);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 201);

        service.delete(id);
    }

    @Test(priority = 5)
    public void deleteCarrito() {
        String body = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 1
            }
          ]
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response creado = service.post(body);
        String id = creado.jsonPath().getString("_id");

        Response response = service.delete(id);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 204);
    }
}