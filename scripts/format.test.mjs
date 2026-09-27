import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from '@babel/parser';
import * as prettier from 'prettier';
import { jsxText } from './prettier-jsx.mjs';

const config = await prettier.resolveConfig(
    new URL('../.prettierrc.json', import.meta.url).pathname,
);
const options = { ...config, parser: 'babel-ts' };

// Ignore source positions, but compare syntax, comments, and rendered JSX text.
function semantic(node) {
    if (Array.isArray(node)) return node.map(semantic);
    if (!node || typeof node !== 'object') return node;
    const result = {};
    for (const key of Object.keys(node).sort()) {
        if (
            [
                'start',
                'end',
                'loc',
                'extra',
                'leadingComments',
                'trailingComments',
                'innerComments',
            ].includes(key)
        )
            continue;
        if (key === 'children' && ['JSXElement', 'JSXFragment'].includes(node.type)) {
            const children = [];
            for (const child of node.children) {
                const text =
                    child.type === 'JSXText'
                        ? jsxText(child.value)
                        : child.type === 'JSXExpressionContainer' &&
                            child.expression.type === 'StringLiteral'
                          ? child.expression.value
                          : null;
                if (text !== null) {
                    if (!text) continue;
                    if (typeof children.at(-1) === 'string') children[children.length - 1] += text;
                    else children.push(text);
                } else children.push(semantic(child));
            }
            result.children = children;
        } else result[key] = semantic(node[key]);
    }
    return result;
}

const fixtures = [
    `const x = <div className="route-content" aria-busy={busy}><MapPin size={16}/>{visible && <span>{title}</span>}</div>;`,
    `const x = <p>Hello <b>world</b> !{' '}<i>next</i>{' text '}</p>;`,
    `const x = <p>&nbsp; &amp; &#32;<b>&lt;tag&gt;</b>  end</p>;`,
    `const x = <>\n hello\n world\n <span>{value}</span>\n</>;`,
    `const x = <Box {...props} value={{enabled:true}}>{/* keep comment */}{items.map(x => <Item key={x.id}>{x.name}</Item>)}</Box>;`,
    `const x = (<Box />).props; const y = (<Box>text</Box>).props;`,
    `const x = <Select<string> value={value} onChange={setValue}/>;`,
    `const x = <p>   </p>; const y = <p>{'a very long string that must keep exactly the same content regardless of the configured line width, even when it exceeds that width'}</p>;`,
];
for (const [index, source] of fixtures.entries()) {
    test(`JSX fixture ${index + 1} preserves meaning and is stable`, async () => {
        const formatted = await prettier.format(source, options);
        const parseOptions = { sourceType: 'module', plugins: ['jsx', 'typescript'] };
        assert.deepEqual(
            semantic(parse(formatted, parseOptions)),
            semantic(parse(source, parseOptions)),
        );
        assert.equal(await prettier.format(formatted, options), formatted);
    });
}

test('requested JSX layout', async () => {
    const formatted = await prettier.format(fixtures[0], options);
    assert.match(formatted, /<div\n {8}className="route-content"\n {8}aria-busy=\{ busy \}\n {4}>/);
    assert.match(formatted, /<MapPin size=\{ 16 \} \/>/);
    assert.match(formatted, /\{\n +title\n +\}/);
});
