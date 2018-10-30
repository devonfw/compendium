# COMPENDIUM
Compendium is a processor for generating, unifying and converting different input sources like [AsciiDoc](https://asciidoctor.org/docs/asciidoc-syntax-quick-reference/) files, [Markdown](https://guides.github.com/features/mastering-markdown/) files, [Confluence](https://confluence.atlassian.com/doc/confluence-wiki-markup-251003035.html) and HTML websites to different output formats. We can **select _all the content_** or only **_parts_ of it** from the input files and generate an AsciiDoc, Markdown, HTML or PDF as output.

## Operating Mode
Compendium uses a JSON Config file with two main parts that define where and how to get the desired unified output:
![BasicMainFlow](images/diagramsDrawio/BasicMainFlow.png)
### Config JSON
#### Input Sources
In this part of the configuration file define the sources of the input files, the types and assign a reference id or name to them.
  - reference: id of the source.
  - source_type: (i.e asciidoc, markdown, html-url, confluence).
  - source: URL or PATH where the information is located. (i.e. https://adcenter.pl.s2-eu.capgemini.com/confluence/)
  ```
  "sources": [
    {
      "reference": "project1",
      "source_type": "asciidoc",
      "source": "./test-data/input/input-data1"
    },
    {
      "reference": "project2",
      "source_type": "asciidoc",
      "source": "./test-data/input/input-data2"
    },
    {
      "reference": "confluence1",
      "source_type": "confluence",
      "source": "https://adcenter.pl.s2-eu.capgemini.com/confluence/",
      "space": "JQ",
      "context": "capgemini"
    }
  ]
  ```
[x] To read from confluence internal network add this arguments to the source part:
  - context: capgemini
  - space: space key of the project, all the urls of the project have this letters. i.e.: (https://adcenter.pl.s2-eu.capgemini.com/confluence/display/HD/2.+Objectives ) space ⇒ HD
  
[x] To read from confluence private account add this arguments to the source part:
  - context: external
  - space: depend on the account, all the urls have a two or three letters / < context > /.
  

### Documents and Sections
  - reference: it refers the source reference, must be the same (source id).
  - document: file name or name/id project inside source path referred (i.e 6.+Entity+relationship+diagram).
  - sections: section/s that you want to extract. If you want to extract all the content of the document you should leave this argument blank, but if you want to extract different sections, write them in an array. (i.e sections: [h1, h3])
  ```
  "documents": [
    {
      "reference": "project1",
      "document": "manual"
    },
    {
      "reference": "project2",
      "document": "brownfox2"
    },
    {
      "reference": "project2",
      "document": "paragraph1"
    }
  ]
  ```
