import {Merger, DocConfig, TextOut, errorinfo} from './types';
import {Result} from 'result.ts';
import * as result from 'result.ts';

export class MergerImpl implements Merger {

    public merge(cfg: DocConfig, out: TextOut): Result<errorinfo, void> {
        throw new Error('Not implemented yet.');

    }
}