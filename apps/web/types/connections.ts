/**
 * Types for Connect the Dots feature
 */

export interface ConnectionItem {
  id: string;
  title: string;
  type: string;
  tags: string[];
}

export interface ConnectionResult {
  id: string;
  contentA: ConnectionItem;
  contentB: ConnectionItem;
  insight: string;
  similarity: number;
  tagGroupA: string[];
  tagGroupB: string[];
}

export interface ConnectionsActionResult {
  success: boolean;
  data?: ConnectionResult[];
  message?: string;
}

export interface GenerateConnectionActionResult {
  success: boolean;
  data?: ConnectionResult;
  message?: string;
}
