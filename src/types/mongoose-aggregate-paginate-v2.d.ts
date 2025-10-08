declare module 'mongoose-aggregate-paginate-v2' {
  import { Aggregate, Document, Model } from 'mongoose';

  interface AggregatePaginateOptions {
    page?: number;
    limit?: number;
    customLabels?: Record<string, string>;
    pagination?: boolean;
    allowDiskUse?: boolean;
    useFacet?: boolean;
  }

  interface AggregatePaginateResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    page?: number;
    totalPages?: number;
    hasPrevPage?: boolean;
    hasNextPage?: boolean;
    prevPage?: number | null;
    nextPage?: number | null;
  }

  export type AggregatePaginateModel<T extends Document> = Model<T> & {
    aggregatePaginate(
      aggregate: Aggregate<T>,
      options: AggregatePaginateOptions
    ): Promise<AggregatePaginateResult<T>>;
  };

  const aggregatePaginate: any;
  export default aggregatePaginate;
}
