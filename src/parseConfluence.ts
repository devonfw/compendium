import {
  DocConfig,
  IndexSource,
  Index,
  TextOut,
  TextIn,
  Transcript,
  Paragraph,
  TextSegment,
  TextElement,
  InlineImage,
  TextInSources,
  RichString,
  RichText,
  TextAttributes,
  Table,
  TableBody,
  Col,
  Row,
  Cell,
  Code,
  TableSegment,
  List,
  Link,
} from './types';
import * as fs from 'fs';
import * as ncp from 'ncp';
import * as shelljs from 'shelljs';
import * as util from 'util';
import { EmitElement } from './emitFunctions';
import { ParseLocal } from './parseLocal';

export class ParseConfluence extends ParseLocal {
  public constructor(basepath: string) {
    super(basepath);
  }
}
