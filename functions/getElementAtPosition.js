import { isWithinElement } from "./isWithinElement";

export function getElementAtPosition(x, y, elements) {
  return elements
    .map((element) => ({
      ...element,
      position: isWithinElement(x, y, element),
    }))
    .find((element) => element.position !== null);
}
