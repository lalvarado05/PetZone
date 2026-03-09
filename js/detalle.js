document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificamos si hay un ID en la URL
    const params = new URLSearchParams(window.location.search);
    const idProducto = parseInt(params.get("id"));

    if (!idProducto) {
        alert("ERROR: No hay ningún ID en la URL. Entra desde productos.html haciendo clic en una imagen.");
        return;
    }

    
    fetch("data/productos.json") 
        .then(response => {
            if (!response.ok) throw new Error("No se encontró el archivo productos.json en la carpeta data/");
            return response.json();
        })
        .then(productos => {
            
            const producto = productos.find(p => p.id === idProducto);

            if (producto) {
                document.getElementById("detalleNombre").innerText = producto.name;
                document.getElementById("detallePrecio").innerText = "₡" + producto.price_crc.toLocaleString();
                document.getElementById("detalleMarca").innerText = "Marca: " + producto.marca;
                document.getElementById("detalleDescripcion").innerText = producto.description;
                
          
                document.getElementById("detalleImagen").src = "img/" + producto.image;

            } else {
                alert("ERROR: El ID " + idProducto + " no existe dentro de tu productos.json");
            }
        })
        .catch(error => {
            alert("ERROR FATAL: " + error.message);
            console.error(error);
        });
});
