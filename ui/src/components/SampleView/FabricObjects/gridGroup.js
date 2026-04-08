import { Group } from 'fabric';
/**
 * Fabric Shape for drawing grid (defined by GridData)
 * @typedef {Group & { id?: string }} GridGroup
 */
export class GridGroup extends Group {
  static type = 'GridGroup';

  static customProperties = ['id'];

  constructor(objects = [], options = {}) {
    super(objects, options);
    this.id = options.id;
  }
}
