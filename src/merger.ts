import {
  Merger,
  DocConfig,
  TextOut,
  TextInSources,
  Index,
  Transcript,
} from './types';
import { PdfFileTextOut } from './pdfOutput';

export class MergerImpl implements Merger {
  /**
   * merger
   * Merges all the transcripts recieved in one single file.
   * @param {TextInSources} textinSources
   * @param {Index} index
   * @param {TextOut} textout
   * @returns {Promise<void>}
   * @memberof MergerImpl
   */
  public async merge(
    textinSources: TextInSources,
    index: Index,
    textout: TextOut,
  ): Promise<void> {
    //get the IR all the transcripts
    const transcripts: Array<Transcript> = [];

    for (const node of index[1]) {
      if (textinSources[node.reference]) {
        try {
          transcripts.push(
            await textinSources[node.reference].getTranscript(
              node.document,
              node.sections,
            ),
          );
        } catch (err) {
          throw new Error(err.message);
        }
      } else {
        const error_msg =
          "Node with id '" +
          node.document +
          "' doesn't have an existing source";
        throw new Error(error_msg);
      }
    }
    //generate the output of all the transcript
    try {
      await textout.generate(transcripts);
    } catch (err) {
      throw err;
    }
  }
}
