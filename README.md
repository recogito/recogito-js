# RecogitoJS

Add text annotation to any website. Build your own customized annotation tools.
[Try the demo](https://recogito.github.io/recogito-js/).

## Using RecogitoJS

The example below shows how to make text annotate-able with just a few lines of JavaScript.
The full API documentation is on the [Wiki](../../wiki/Developer-Documentation).

```html
<body>
  <!-- The text content we want to annotate -->
  <pre id="content">My text to annotate.</pre>

  <!-- Initialize Recogito and load a bunch of annotations -->
  <script type="text/javascript">
    (function() {

      var r = Recogito.init({
        // REQUIRED - the DOM element to make annotate-able or its ID
        content: 'content',

        // OPTIONAL - 'true' for read-only display (default = false)
        readOnly: false,

        // OPTIONAL - a function that allows you to add your
        // your own CSS class names to annotation highlights
        formatter: function(annotation) {
          return 'my-class';
        }
      });

      r.loadAnnotations('annotations.w3c.json');

      // Add event handlers using .on  
      r.on('createAnnotation', function(annotation) {
        // Do something
      });

    })();
  </script>
</body>
```

## Developer Information

To run the project in development mode:

- Run `npm install` to install dependencies
- Run `npm start` and go to [localhost:3000](http://localhost:3000)

To build the minified bundle, run `npm run build`.

## Annotation Format

RecogitoJS supports annotations in JSON-LD, according to the
[W3C Web Annotation model](https://www.w3.org/TR/annotation-model/).

```json
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/annotation/494718ed-72a7-4d33-b78e-e74b5f00259e",
  "type": "Annotation",
  "body": [{
    "type": "TextualBody",
    "value": "This is a comment."
  },{
    "type": "TextualBody",
    "value": "MyTag",
    "purpose": "tagging"
  }],
  "target": {
    "source": "http://example.com/my-page",
    "selector": [{
      "type": "TextQuoteSelector",
      "exact": "Troy"
    },{
      "type": "TextPositionSelector",
      "start": 106,
      "end": 110
    }]
  }
}
```

## License

[BSD 3-Clause](LICENSE) (= feel free to use this code in whatever way
you wish. But keep the attribution/license file, and if this code
breaks something, don't complain to us :-) 

