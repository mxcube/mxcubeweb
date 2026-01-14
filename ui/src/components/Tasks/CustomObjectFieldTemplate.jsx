import groupBy from 'lodash/groupBy';

import { CollapsableRows, FieldsHeader } from './fields';
/**
 * @param {import('@rjsf/utils').ObjectFieldTemplateProps} props
 * @returns {JSX.Element}
 */
export default function CustomObjectFieldTemplate({
  properties,
  uiSchema = {},
}) {
  const groups = groupBy(
    properties,
    (field) => uiSchema[field.name]?.['ui:options']?.group,
  );

  const { undefined: ungroupedFields = [], ...groupedFieldsMap } = groups;
  const groupNames = Object.keys(groupedFieldsMap);

  return (
    <div>
      {ungroupedFields.length > 0 && (
        <>
          <FieldsHeader title="Acquisition" />
          <div className="row">
            {ungroupedFields.map(({ content }) => content)}
          </div>
        </>
      )}
      {groupNames.map((group) => {
        const fields = groupedFieldsMap[group];
        return (
          <div key={group}>
            <FieldsHeader title={group} />
            <CollapsableRows defaultCollapsed={false}>
              <div className="row">{fields.map(({ content }) => content)}</div>
            </CollapsableRows>
          </div>
        );
      })}
    </div>
  );
}
