document.addEventListener("DOMContentLoaded", () => {
  async function locale() {
    let response = await fetch("../assets/metadata/localization.json");
    let localization = await response.json();
    console.log(localization);
  }
  locale();
});
