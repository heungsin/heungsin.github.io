// 모바일 메뉴
const menuBtn = document.querySelector('.menu-btn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('mobile-open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? '✕' : '☰';
  });
}

// 맨 위로 버튼
const floating = document.querySelector('.floating');
if (floating) {
  const toggle = () => floating.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

// 고객 문의: FormSubmit 전송 후 돌아올 주소를 절대경로로 지정하고, 전송 완료 안내 표시
const form = document.querySelector('form.form');
if (form) {
  const next = form.querySelector('input[name="_next"]');
  if (next) next.value = location.href.split('?')[0].split('#')[0] + '?sent=1';
  if (new URLSearchParams(location.search).get('sent') === '1') {
    const msg = form.querySelector('.form-sent');
    if (msg) msg.classList.add('show');
  }
}
