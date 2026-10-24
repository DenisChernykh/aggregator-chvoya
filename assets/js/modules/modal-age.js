import { Modals } from "../libs/vgmodals/vgmodals.js";

const COOKIE_NAME = "ageGate";
const COOKIE_VALUE = "passed";

function setAgeGateCookie() {
  sessionStorage.setItem(COOKIE_NAME, COOKIE_VALUE);
}

export function initModalAge() {
  if (sessionStorage.getItem(COOKIE_NAME)) return;

  const modal = Modals.getModal("modalAge");
  if (!modal) return;

  requestAnimationFrame(() => {
    modal.open();
  });

  Modals.getModal('modalAge').onAction((type, modal) => {
    if (type === 'cancel') {  
      modal.close()
      Modals.getModal('modalAgeDeny').open();
    } else if (type === 'confirm') {
        modal.close();
        setAgeGateCookie();
    }
});
}
