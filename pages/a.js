export default function A({ a, delay }) {
  blockCpuFor(delay);
  return (
    <div>
      a<span>{a}</span>
    </div>
  );
}

function blockCpuFor(ms) {
  var now = new Date().getTime();
  var result = 0;
  while (true) {
    result += Math.random() * Math.random();
    if (new Date().getTime() > now + ms) return;
  }
}

export async function getServerSideProps(context) {
  return {
    props: {
      a: 1,
      delay: context.query.delay ? parseInt(context.query.delay, 10) : 0,
    }, // will be passed to the page component as props
  };
}
