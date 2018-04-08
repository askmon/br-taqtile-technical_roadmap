export enum DatumType {
  checkpoint = 'checkpoint',
  topic = 'topic',
}

export enum RecommendationType {
  solid = 'solid',
}

export class Datum {
  name: string;
  id: string;
  type: DatumType;
  recommendation?: RecommendationType;
  children?: Array<Datum>
  _children?: Array<Datum>
}
