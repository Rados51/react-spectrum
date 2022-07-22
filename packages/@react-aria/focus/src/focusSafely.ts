/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {FocusableElement} from '@react-types/shared';
import {focusWithoutScrolling, runAfterTransition} from '@react-aria/utils';
import {getInteractionModality} from '@react-aria/interactions';

// Define an IntersectionObserver to evaluate whether the browser should scroll an element receiving focus into view.
const intersectionObserver = (() => {
  const intersectionObserverOptions:IntersectionObserverInit = {
    root: undefined,
    rootMargin: '0px', 
    threshold: 1
  };

  const scrollIntoViewOptions:ScrollIntoViewOptions = {
    behavior: 'auto',
    block: 'nearest',
    inline: 'nearest'
  };

  const intersectionObserverCallback = (entries:Array<IntersectionObserverEntry>, observer:IntersectionObserver) => {
    entries.forEach(entry => {
      // If the element receiving focus is not within the browser viewport, scroll it into view 
      if (!entry.isIntersecting) {
        runAfterTransition(() => entry.target.scrollIntoView(scrollIntoViewOptions));
      }
      observer.unobserve(entry.target);
    });
  };

  try {
    return new IntersectionObserver(intersectionObserverCallback, intersectionObserverOptions);
  } catch (err) {
    return undefined;
  }
})();

/**
 * A utility function that focuses an element while avoiding undesired side effects such
 * as page scrolling and screen reader issues with CSS transitions.
 */

export function focusSafely(element: FocusableElement) {
  const modality = getInteractionModality();
  const lastFocusedElement = document.activeElement;

  // If the user is interacting with a virtual cursor, e.g. screen reader, then
  // wait until after any animated transitions that are currently occurring on
  // the page before shifting focus. This avoids issues with VoiceOver on iOS
  // causing the page to scroll when moving focus if the element is transitioning
  // from off the screen.
  if (modality === 'virtual') {
    runAfterTransition(() => {
      // If focus did not move and the element is still in the document, focus it.
      if (document.activeElement === lastFocusedElement && document.contains(element)) {
        focusWithoutScrolling(element);
        if (intersectionObserver) {
          intersectionObserver.observe(element);
        }
      }
    });
  } else {
    focusWithoutScrolling(element);
    if (intersectionObserver &&
      (
        // Don't test for intersectionObserver to scroll the element into view
        // within the document body on pointer events, unless the element 
        // focusing safely is not the element that received interaction to focus it.
        modality !== 'pointer' || 
        !(
          lastFocusedElement.contains(element) || 
          element.contains(lastFocusedElement) || 
          element === lastFocusedElement
        )
      )
    ) {
      intersectionObserver.observe(element);
    }
  }
}
