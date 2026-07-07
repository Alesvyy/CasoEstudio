package tests;

import base.BaseTest;
import data.TestData;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;
import services.ProductoService;

public class ProductoTest extends BaseTest {

    private final ProductoService service = new ProductoService();

    @Test(priority = 1)
    public void getProductos() {
        Response response = service.getAll();
        Assert.assertEquals(response.statusCode(), 200);
    }

    @Test(priority = 2)
    public void postProductoValido() {
        String nombre = "Producto Test " + System.currentTimeMillis();

        String body = """
        {
          "nombre": "%s",
          "precio": 15000,
          "descripcion": "Producto de prueba",
          "imagen": "test.jpg",
          "categoria": "%s",
          "stock": 10
        }
        """.formatted(nombre, TestData.CATEGORIA_ID);

        Response response = service.post(body);
        Assert.assertEquals(response.statusCode(), 201);
        Assert.assertTrue(response.asString().contains(nombre));
    }

    @Test(priority = 3)
    public void postProductoInvalido() {
        String body = """
        {
          "descripcion": "Sin nombre ni precio"
        }
        """;

        Response response = service.post(body);
        Assert.assertTrue(response.statusCode() >= 400);
    }

    @Test(priority = 4)
    public void putProducto() {
        String bodyCrear = """
        {
          "nombre": "Producto PUT",
          "precio": 10000,
          "descripcion": "Temporal",
          "imagen": "put.jpg",
          "categoria": "%s",
          "stock": 5
        }
        """.formatted(TestData.CATEGORIA_ID);

        Response creado = service.post(bodyCrear);
        String id = creado.jsonPath().getString("_id");

        String bodyActualizar = """
        {
          "nombre": "Producto PUT Actualizado",
          "precio": 20000,
          "descripcion": "Actualizado",
          "imagen": "actualizado.jpg",
          "categoria": "%s",
          "stock": 15
        }
        """.formatted(TestData.CATEGORIA_ID);

        Response response = service.put(id, bodyActualizar);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 201);
        Assert.assertTrue(response.asString().contains("Actualizado"));

        service.delete(id);
    }

    @Test(priority = 5)
    public void deleteProducto() {
        String body = """
        {
          "nombre": "Producto DELETE",
          "precio": 1000,
          "descripcion": "Temporal",
          "imagen": "delete.jpg",
          "categoria": "%s",
          "stock": 1
        }
        """.formatted(TestData.CATEGORIA_ID);

        Response creado = service.post(body);
        String id = creado.jsonPath().getString("_id");

        Response response = service.delete(id);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 204);
    }
}