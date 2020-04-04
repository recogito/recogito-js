import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Emitter from 'tiny-emitter';
import { WebAnnotation, deflateHTML } from 'recogito-client-core';
import App from './App';

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

    // Content is wrapped in a container DIV, and the application 
    // DIV (which contains the editor popup) is attached as a sibling. This 
    // way the content and editor share the same CSS position reference frame.
    let content = (config.content.nodeType) ? 
      config.content : document.getElementById(config.content);

    // Unless this is preformatted text, remove multi spaces and 
    // empty text node, so that HTML char offsets == browser offsets.
    if (config.mode !== 'pre') {
      content = deflateHTML(content);
    }

    const wrapper = document.createElement('DIV');
    wrapper.style.position = 'relative';
    content.parentNode.insertBefore(wrapper, content);
    wrapper.appendChild(content);
    
    const container = document.createElement('DIV');
    wrapper.appendChild(container);

    ReactDOM.render(

      <App 
        ref={this._app}
        contentEl={content}
        containerEl={wrapper} 
        readOnly={config.readOnly}
        formatter={config.formatter}
        onAnnotationCreated={this.handleAnnotationCreated} 
        onAnnotationUpdated={this.handleAnnotationUpdated} 
        onAnnotationDeleted={this.handleAnnotationDeleted} />,
    
    container);
  }

  handleAnnotationCreated = annotation => {
    this._emitter.emit('createAnnotation', annotation);
  }

  handleAnnotationUpdated = (annotation, previous) => {
    this._emitter.emit('updateAnnotation', annotation, previous);
  }

  handleAnnotationDeleted = annotation => {
    this._emitter.emit('deleteAnnotation', annotation);
  }
  
  /******************/               
  /*  External API  */
  /******************/     
  
  /**
   * Adds a JSON-LD WebAnnotation to the annotation layer.
   */
  addAnnotation = annotation => {
    this._app.current.addAnnotation(new WebAnnotation(annotation));
  }

  /**
   * Removes the given JSON-LD WebAnnotation from the annotation layer.
   */
  removeAnnotation = annotation => {
    this._app.current.removeAnnotation(new WebAnnotation(annotation));
  }

  /** 
   * Loads JSON-LD WebAnnotations from the given URL.
   */
  loadAnnotations = url => axios.get(url).then(response => {
    const annotations = response.data.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(annotations);
    return annotations;
  });

  /**
   * Returns all annotations
   */
  getAnnotations = () => 
    this._app.current.getAnnotations();

  /**
   * Activates annotation or relationship drawing mode. 
   * @param mode a string, either ANNOTATION (default) or RELATIONS
   */
  setMode = mode => {
    this._app.current.setMode(mode);
  }

  /** 
   * Adds an event handler.
   */
  on = (event, handler) => {
    this._emitter.on(event, handler);
  }

  /** 
   * Removes an event handler.
   * 
   * If no callback, removes all handlers for 
   * the given event.
   */
  off = (event, callback) => {
    this._emitter.off(event, callback);
  }

}

export const init = config => {
  return new Recogito(config);
}

