document.addEventListener("DOMContentLoaded", function () {
  // List of known routes (adjust this array as needed)
  const knownRoutes = ["/", "/index", "/forum", "/auth/login", "/auth/register"];
  if (!knownRoutes.includes(window.location.pathname)) {
    document.body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#001f3f; color: white;">
         <h1 style="font-size:100px; color: var(--spezz-blue, #0099ff); margin-bottom:20px;">404</h1>
         <div style="width:200px; height:200px; background: var(--spezz-blue, #0099ff); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:50px; margin:20px auto;">🤖</div>
         <p style="font-size:24px;">Oops... We couldn't find what you're looking for.</p>
      </div>
    `;
  }
});
