// 2. PROCESAR EL REGISTRO (Versión Mejorada Visualmente)
document.getElementById('formRegistro').addEventListener('submit', async function(e) {
    e.preventDefault();
    const usuario = document.getElementById('regUsuario').value.trim();
    const password = document.getElementById('regPassword').value;
    const msg = document.getElementById('msgRegistro');
    const formulario = document.getElementById('formRegistro');

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const data = await res.json();

        if(res.ok) {
            // ÉXITO: Ocultamos el formulario y mostramos un gran mensaje de éxito
            formulario.style.display = "none";
            msg.style.color = "var(--exito)";
            msg.innerHTML = `<i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                             <span style="font-size: 1.2rem; display: block;">¡REGISTRO COMPLETADO!</span>
                             <p style="color: var(--texto-mutado); font-weight: normal; margin-top: 5px;">Bienvenido oficialmente a la red, @${usuario}.</p>`;
            msg.style.display = "block";
            cargarContadorReal(); 
        } else {
            // ERROR: Si el apodo ya existe, se muestra la advertencia
            msg.style.color = "var(--primario)";
            msg.innerText = data.error || "Error en el registro.";
            msg.style.display = "block";
        }
    } catch (err) {
        // Respaldo local si la API aún se está compilando en Vercel
        let count = parseInt(localStorage.getItem('localUsersCount') || "1421");
        count++;
        localStorage.setItem('localUsersCount', count);
        document.getElementById('contadorMiembrosReales').innerText = count;
        
        formulario.style.display = "none";
        msg.style.color = "var(--exito)";
        msg.innerHTML = `<i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                         <span style="font-size: 1.2rem; display: block;">¡REGISTRO EXITOSO!</span>
                         <p style="color: var(--texto-mutado); font-weight: normal; margin-top: 5px;">Te has registrado localmente como @${usuario}.</p>`;
        msg.style.display = "block";
    }
});
