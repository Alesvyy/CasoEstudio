package tests;

import base.BaseTest;
import data.TestData;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;
import services.OrdenService;

public class OrdenTest extends BaseTest {

    private final OrdenService service = new OrdenService();

    @Test(priority = 1)
    public void getOrdenes() {
        Response response = service.getAll();
        Assert.assertEquals(response.statusCode(), 200);
    }

    @Test(priority = 2)
    public void postOrdenValida() {
        String body = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 1,
              "precio": 350000
            }
          ],
          "total": 350000,
          "estado": "pendiente"
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response response = service.post(body);
        Assert.assertEquals(response.statusCode(), 201);
        Assert.assertNotNull(response.jsonPath().getString("_id"));
    }

    @Test(priority = 3)
    public void postOrdenInvalida() {
        String body = """
        {
          "estado": "estado_invalido"
        }
        """;

        Response response = service.post(body);
        Assert.assertTrue(response.statusCode() >= 400);
    }

    @Test(priority = 4)
    public void putOrden() {
        String bodyCrear = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 1,
              "precio": 350000
            }
          ],
          "total": 350000,
          "estado": "pendiente"
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response creada = service.post(bodyCrear);
        String id = creada.jsonPath().getString("_id");

        String bodyActualizar = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 1,
              "precio": 350000
            }
          ],
          "total": 350000,
          "estado": "pagada"
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response response = service.put(id, bodyActualizar);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 201);
        Assert.assertTrue(response.asString().contains("pagada"));

        service.delete(id);
    }

    @Test(priority = 5)
    public void deleteOrden() {
        String body = """
        {
          "usuario": "%s",
          "productos": [
            {
              "producto": "%s",
              "cantidad": 1,
              "precio": 350000
            }
          ],
          "total": 350000,
          "estado": "pendiente"
        }
        """.formatted(TestData.USUARIO_ID, TestData.PRODUCTO_ID);

        Response creada = service.post(body);
        String id = creada.jsonPath().getString("_id");

        Response response = service.delete(id);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 204);
    }
}