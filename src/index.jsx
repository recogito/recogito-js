import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import {
  WebAnnotation,
  createEnvironment,
  setLocale
} from '@recogito/recogito-client-core';
import TextAnnotator from './TextAnnotator';
import { deflateHTML } from './utils';

import '@recogito/recogito-client-core/themes/default';

/**
 * The entrypoint into the application. Provides the
 * externally visible JavaScript API.
 */
export class Recogito {

  constructor(config) {
    // API calls to this instance are forwarded through a ref
    this._app = React.createRef();

    // Event handling via tiny-emitter
    this._emitter = new Emitter();

    // Environment settings container
    this._environment = createEnvironment();

    // The content element (which contains the text we want to annotate)
    // is wrapped in a DIV ('wrapperEl'). The application container DIV,
    // which holds the editor popup, will be attached as a child to the
    // wrapper element (=a sibling to the content element). This way,
    // content and editor share the same CSS position reference frame.
    //
    // <wrapperEl>
    //   <contentEl />
    //   <appContainerEl />
    // </wrapperEl>
    //
    let contentEl = (config.content.nodeType) ?
      config.content : document.getElementById(config.content);

    // Deep-clone the original node, so we can easily destroy the Recogito instance
    this._originalContent = contentEl.cloneNode(true);

    // Unless this is preformatted text, remove multi spaces and
    // empty text nodes, so that HTML char offsets == browser offsets.
    if (config.mode !== 'pre')
      contentEl = deflateHTML(contentEl);

    this._wrapperEl = document.createElement('DIV');
    this._wrapperEl.className = 'r6o-content-wrapper';
    this._wrapperEl.style.position = 'relative';

    if (contentEl instanceof HTMLBodyElement) {
      this._wrapperEl.append(...contentEl.childNodes);
      contentEl.appendChild(this._wrapperEl);
    } else {
      contentEl.parentNode.insertBefore(this._wrapperEl, contentEl);
      this._wrapperEl.appendChild(contentEl);
    }


    this._appContainerEl = document.createElement('DIV');
    this._wrapperEl.appendChild(this._appContainerEl);

    setLocale(config.locale);

    ReactDOM.render(
      <TextAnnotator
        ref={this._app}
        env={this._environment}
        contentEl={contentEl}
        wrapperEl={this._wrapperEl}
        config={config}
        onAnnotationSelected={this.handleAnnotationSelected}
        onAnnotationCreated={this.handleAnnotationCreated}
        onAnnotationUpdated={this.handleAnnotationUpdated}
        onAnnotationDeleted={this.handleAnnotationDeleted}
        onCancelSelected={this.handleCancelSelected}
        relationVocabulary={config.relationVocabulary} />, this._appContainerEl);
  }

  handleAnnotationSelected = (annotation, element) =>
    this._emitter.emit('selectAnnotation', annotation.underlying, element);

  handleAnnotationCreated = (annotation, overrideId) =>
    this._emitter.emit('createAnnotation', annotation.underlying, overrideId);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation.underlying, previous.underlying);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation.underlying);

  handleCancelSelected = annotation =>
    this._emitter.emit('cancelSelected', annotation.underlying);

  /******************/
  /*  External API  */
  /******************/

  // Common shorthand for handling annotationOrId args
  _wrap = annotationOrId =>
    annotationOrId?.type === 'Annotation' ? new WebAnnotation(annotationOrId) : annotationOrId;

  addAnnotation = annotation =>
    this._app.current.addAnnotation(new WebAnnotation(annotation));

  clearAnnotations = () =>
    this.setAnnotations(null);

  clearAuthInfo = () =>
    this._environment.user = null;

  destroy = () => {
    ReactDOM.unmountComponentAtNode(this._appContainerEl);
    this._wrapperEl.parentNode.insertBefore(this._originalContent, this._wrapperEl);
    this._wrapperEl.parentNode.removeChild(this._wrapperEl);
  }

  get disableEditor() {
    return this._app.current.disableEditor;
  }

  set disableEditor(disabled) {
    this._app.current.disableEditor = disabled;
  }

  get disableSelect() {
    return this._app.current.disableSelect;
  }

  set disableSelect(select) {
    this._app.current.disableSelect = select;
  }

  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a.underlying);
  }

  loadAnnotations = (url, requestArgs) => fetch(url, requestArgs)
    .then(response => response.json()).then(annotations => {
      return this.setAnnotations(annotations).then(() => annotations);
    });

  off = (event, callback) =>
    this._emitter.off(event, callback);

  on = (event, handler) =>
    this._emitter.on(event, handler);

  get readOnly() {
    return this._app.current.readOnly;
  }

  set readOnly(readOnly) {
    this._app.current.readOnly = readOnly;
  }

  removeAnnotation = annotation =>
    this._app.current.removeAnnotation(new WebAnnotation(annotation));

  selectAnnotation = annotationOrId => {
    const selected = this._app.current.selectAnnotation(this._wrap(annotationOrId));
    return selected?.underlying;
  }

  setAnnotations = arg => {
    const annotations = arg || [];
    const webannotations = annotations.map(a => new WebAnnotation(a));
    return this._app.current.setAnnotations(webannotations);
  }

  setAuthInfo = authinfo =>
    this._environment.user = authinfo;

  /**
   * Activates annotation or relationship drawing mode.
   * @param mode a string, either ANNOTATION (default) or RELATIONS
   */
  setMode = mode =>
    this._app.current.setMode(mode);

  setServerTime = timestamp =>
    this._environment.setServerTime(timestamp);

  get widgets() {
    return this._app.current.widgets;
  }

  set widgets(widgets) {
    this._app.current.widgets = widgets;
  }

}

export const init = config => new Recogito(config);
