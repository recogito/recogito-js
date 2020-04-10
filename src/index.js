import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Emitter from 'tiny-emitter';
import { TextAnnotator, Editor, WebAnnotation, deflateHTML } from '@recogito/recogito-client-core';

import '@recogito/recogito-client-core/themes/default';

/**
 * The entrypoint into the application. Provides the 
 * externally visible JavaScript API.
 */
class Recogito {

  constructor(config) {   
    // Programmatic calls to this instance from outside are forwarded
    // through a ref
    this._app = React.createRef();

    // Event handling via tiny-emitter
    this._emitter = new Emitter();

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

    // Unless this is preformatted text, remove multi spaces and 
    // empty text nodes, so that HTML char offsets == browser offsets.
    if (config.mode !== 'pre')
      contentEl = deflateHTML(contentEl);

    const wrapperEl = document.createElement('DIV');
    wrapperEl.style.position = 'relative';
    contentEl.parentNode.insertBefore(wrapperEl, contentEl);
    wrapperEl.appendChild(contentEl);
    
    const appContainerEl = document.createElement('DIV');
    wrapperEl.appendChild(appContainerEl);

    const { CommentWidget, TagWidget } = Editor;

    // A basic TextAnnotator with just a comment and a tag widget.
    ReactDOM.render(
      <TextAnnotator 
        ref={this._app}
        contentEl={contentEl}
        wrapperEl={wrapperEl}
        readOnly={config.readOnly}
        formatter={config.formatter}
        onAnnotationCreated={this.handleAnnotationCreated} 
        onAnnotationUpdated={this.handleAnnotationUpdated} 
        onAnnotationDeleted={this.handleAnnotationDeleted}>

        <CommentWidget />
        <TagWidget />

      </TextAnnotator>,
    
    appContainerEl);
  }

  handleAnnotationCreated = annotation =>
    this._emitter.emit('createAnnotation', annotation.underlying);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation.underlying, previous.underlying);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation.underlying);
  
  /******************/               
  /*  External API  */
  /******************/     
  
  /**
   * Adds a JSON-LD WebAnnotation to the annotation layer.
   */
  addAnnotation = annotation =>
    this._app.current.addAnnotation(new WebAnnotation(annotation));

  /**
   * Removes the given JSON-LD WebAnnotation from the annotation layer.
   */
  removeAnnotation = annotation =>
    this._app.current.removeAnnotation(new WebAnnotation(annotation));

  /** 
   * Loads JSON-LD WebAnnotations from the given URL.
   */
  loadAnnotations = url => axios.get(url).then(response => {
    const annotations = response.data.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(annotations);
    return annotations;
  });

  /** Initializes with the list of WebAnnotations **/
  setAnnotations = annotations => {
    const webannotations = annotations.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(webannotations);
  }

  /**
   * Returns all annotations
   */
  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a.underlying);
  }

  /**
   * Activates annotation or relationship drawing mode. 
   * @param mode a string, either ANNOTATION (default) or RELATIONS
   */
  setMode = mode =>
    this._app.current.setMode(mode);

  /** 
   * Adds an event handler.
   */
  on = (event, handler) =>
    this._emitter.on(event, handler);

  /** 
   * Removes an event handler.
   * 
   * If no callback, removes all handlers for 
   * the given event.
   */
  off = (event, callback) =>
    this._emitter.off(event, callback);

}

export const init = config => new Recogito(config);

