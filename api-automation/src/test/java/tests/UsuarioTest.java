package tests;

import base.BaseTest;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;
import services.UsuarioService;

public class UsuarioTest extends BaseTest {

    private final UsuarioService service = new UsuarioService();

    @Test(priority = 1)
    public void getUsuarios() {
        Response response = service.getAll();
        Assert.assertEquals(response.statusCode(), 200);
    }

    @Test(priority = 2)
    public void postUsuarioValido() {
        String correo = "usuario" + System.currentTimeMillis() + "@prueba.com";

        String body = """
        {
          "nombre": "Usuario Test",
          "correo": "%s",
          "password": "Hola123",
          "rol": "cliente"
        }
        """.formatted(correo);

        Response response = service.post(body);
        Assert.assertEquals(response.statusCode(), 201);
        Assert.assertTrue(response.asString().contains(correo));
    }

    @Test(priority = 3)
    public void postUsuarioInvalido() {
        String body = """
        {
          "nombre": "Usuario Sin Password",
          "correo": "sinpassword@prueba.com",
          "rol": "cliente"
        }
        """;

        Response response = service.post(body);
        Assert.assertTrue(response.statusCode() >= 400);
    }

    @Test(priority = 4)
    public void putUsuario() {
        String correo = "put" + System.currentTimeMillis() + "@prueba.com";

        String bodyCrear = """
        {
          "nombre": "Usuario PUT",
          "correo": "%s",
          "password": "Hola123",
          "rol": "cliente"
        }
        """.formatted(correo);

        Response creado = service.post(bodyCrear);
        String id = creado.jsonPath().getString("_id");

        String bodyActualizar = """
        {
          "nombre": "Usuario Actualizado",
          "correo": "%s",
          "password": "Hola123",
          "rol": "cliente"
        }
        """.formatted(correo);

        Response response = service.put(id, bodyActualizar);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 201);
        Assert.assertTrue(response.asString().contains("Usuario Actualizado"));

        service.delete(id);
    }

    @Test(priority = 5)
    public void deleteUsuario() {
        String correo = "delete" + System.currentTimeMillis() + "@prueba.com";

        String body = """
        {
          "nombre": "Usuario DELETE",
          "correo": "%s",
          "password": "Hola123",
          "rol": "cliente"
        }
        """.formatted(correo);

        Response creado = service.post(body);
        String id = creado.jsonPath().getString("_id");

        Response response = service.delete(id);
        Assert.assertTrue(response.statusCode() == 200 || response.statusCode() == 204);
    }
}