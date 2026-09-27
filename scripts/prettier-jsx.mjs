import { doc } from 'prettier';
import * as estree from 'prettier/plugins/estree';
import { parseExpression } from '@babel/parser';

const { group, hardline, indent, join, line, softline } = doc.builders;

// Match JSX's whitespace handling before putting each child on its own line.
export function jsxText(value) {
    const lines = value.split(/\r\n|\n|\r/);
    let lastNonEmpty = 0;
    lines.forEach((text, index) => {
        if (/[^ \t]/.test(text)) lastNonEmpty = index;
    });
    return lines
        .map((text, index) => {
            let cleaned = text.replace(/\t/g, ' ');
            if (index !== 0) cleaned = cleaned.replace(/^ +/, '');
            if (index !== lines.length - 1) cleaned = cleaned.replace(/ +$/, '');
            return cleaned && index !== lastNonEmpty ? `${cleaned} ` : cleaned;
        })
        .join('');
}

function printText(node) {
    const raw = node.extra?.raw ?? node.raw ?? node.value;
    // Entity-encoded whitespace would be trimmed at new JSX line boundaries.
    // A string expression preserves the decoded text exactly.
    if (/&(?:#\d+|#x[a-f\d]+|[a-z\d]+);/i.test(raw)) {
        const decoded = parseExpression(`<x>${raw}</x>`, { plugins: ['jsx'] }).children[0].value;
        const value = jsxText(decoded);
        const literal = value
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n');
        return `{ '${literal}' }`;
    }
    const value = jsxText(raw);
    if (!value) return '';
    const leading = value.match(/^ +/)?.[0] ?? '';
    const trailing = value.trim() ? (value.match(/ +$/)?.[0] ?? '') : '';
    const text = value.slice(leading.length, value.length - trailing.length);
    return [leading ? `{ '${leading}' }` : '', text, trailing ? `{ '${trailing}' }` : '']
        .filter(Boolean)
        .join('\n');
}

function print(path, options, printChild) {
    const node = path.node;
    switch (node.type) {
        case 'JSXExpressionContainer': {
            if (node.expression.type === 'JSXEmptyExpression') {
                return estree.printers.estree.print(path, options, printChild);
            }
            const expression = path.call(printChild, 'expression');
            const literal =
                ['StringLiteral', 'Literal'].includes(node.expression.type) &&
                typeof node.expression.value === 'string';
            if (path.parent.type === 'JSXAttribute' || literal) {
                return group(['{', indent([line, expression]), line, '}']);
            }
            return ['{', indent([hardline, expression]), hardline, '}'];
        }
        case 'JSXSpreadAttribute':
            return group(['{ ...', path.call(printChild, 'argument'), ' }']);
        case 'JSXOpeningElement': {
            const name = path.call(printChild, 'name');
            const typeArguments = node.typeArguments
                ? path.call(printChild, 'typeArguments')
                : node.typeParameters
                  ? path.call(printChild, 'typeParameters')
                  : '';
            const attributes = path.map(printChild, 'attributes');
            if (attributes.length === 0)
                return ['<', name, typeArguments, node.selfClosing ? ' />' : '>'];
            return group(
                [
                    '<',
                    name,
                    typeArguments,
                    indent([line, join(hardline, attributes)]),
                    node.selfClosing ? line : softline,
                    node.selfClosing ? '/>' : '>',
                ],
                { shouldBreak: attributes.length > 1 },
            );
        }
        case 'JSXElement':
        case 'JSXFragment': {
            if (node.openingElement?.selfClosing) {
                return estree.printers.estree.print(path, options, printChild);
            }
            const children = [];
            path.each((childPath) => {
                if (childPath.node.type === 'JSXText') {
                    const text = printText(childPath.node);
                    if (text) children.push(join(hardline, text.split('\n')));
                } else {
                    children.push(printChild(childPath));
                }
            }, 'children');
            const fragment = node.type === 'JSXFragment';
            const result = [
                fragment ? '<>' : path.call(printChild, 'openingElement'),
                children.length ? indent([hardline, join(hardline, children)]) : '',
                hardline,
                fragment ? '</>' : path.call(printChild, 'closingElement'),
            ];
            if (['JSXElement', 'JSXFragment'].includes(path.parent.type)) return result;
            return group(['(', indent([softline, result]), softline, ')']);
        }
        default:
            return estree.printers.estree.print(path, options, printChild);
    }
}

export const printers = { estree: { ...estree.printers.estree, print } };
