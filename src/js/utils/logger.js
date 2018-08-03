export default function log (...args) {
  args.unshift('background:rgb(51,51,51); color: #bdbdbd;font-size: 12px; padding: 0;');
  args.unshift('%c[cc-devtool] ▶ ');
  return console.log.apply(console, args);
}