export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', {
    mounted(el, binding) {
      el.clickOutsideEvent = function (event: { target: unknown }) {
        // Check if the clicked element is neither the element
        // to which the directive is applied nor its child
        if (!(el === event.target || el.contains(event.target))) {
          // Invoke the provided method
          binding.value(event);
        }
      };
      document.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el) {
      // Remove the event listener when the bound element is unmounted
      document.removeEventListener('click', el.clickOutsideEvent);
    },
  });
});
