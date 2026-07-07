package tests;

import base.BaseTest;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;
import services.CategoriaService;

public class CategoriaTest extends BaseTest {

    private final CategoriaService service = new CategoriaService();

    @Test(priority = 1)
    public void getCategorias() {
        Response response = service.getAll();
        Assert.assertEquals(response.statusCode(), 200);
    }

    @Test(priority = 2)
    public void postCategoriaValida() {
        String nombre = "Categoria Test " + System.currentTimeMillis();

        String body = """
        {
          "nombre": "%s",
          "descripcion": "Categoria de prueba"
        }
        """.formatted(nombre);

        Response response = service.post(body);
        Assert.assertEquals(response.statusCode(), 201);
        Assert.assertTrue(response.asString().contains(nombre));
    }

    @Test(priority = 3)
    public void postCategoriaInvalida() {
        String body = """
        {
          "descripcion": "Sin nombre"
        }
        """;

        Response response = service.post(body);
        Assert.assertTrue(response.statusCode() >= 400);
    }

    @Test(priority = 4)
    public void putCategoria() {
        String bodyCrear = """
        {
          "nombre": "Categoria PUT",
          "descripcion": "Temporal"
        }
        """;

        Response creada = service.post(bodyCrear);
        String id = creada.jsonPath().getString("_id");

        String bodyActualizar = """
        {
          "nombre": "Categoria PUT Actualizada",
          "descripcion": "Actualizada"
        }
        """;

        Response response = service.put(id, bodyActualizar);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 201);
        Assert.assertTrue(response.asString().contains("Actualizada"));

        service.delete(id);
    }

    @Test(priority = 5)
    public void deleteCategoria() {
        String body = """
        {
          "nombre": "Categoria DELETE",
          "descripcion": "Temporal"
        }
        """;

        Response creada = service.post(body);
        String id = creada.jsonPath().getString("_id");

        Response response = service.delete(id);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 204);
    }
}