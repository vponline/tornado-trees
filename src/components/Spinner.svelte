<script lang="ts">

</script>

<div class="spinner"></div>

<style>
.spinner {
  display: inline-block;
  width: 30px;
  height: 30px;
}

.spinner:after {
  content: " ";
  display: block;
  width: 20px;
  height: 20px;
  margin: 8px;
  border-radius: 50%;
  border: 2px solid #94febf;
  border-color: #94febf transparent #94febf transparent;
  animation: spinner 1.2s linear infinite;
}
@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

</style>