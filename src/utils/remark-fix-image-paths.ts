import { visit } from 'unist-util-visit';

export const remarkFixImagePaths = () => (tree) => {
  visit(tree, 'image', (node) => {
    if (typeof node.url === 'string' && node.url.startsWith('/src/assets/')) {
      node.url = node.url.slice(1); // ⚡ Xóa dấu '/'
    }
  });
};
