<script lang="ts">

</script>

<div class="skeleton"></div>

<style>
.skeleton:empty {
  width: 100px;
  height: 18px;
  background: 
    linear-gradient(0.25turn, transparent, rgb(185, 185, 185), transparent);
  background-repeat: no-repeat;
  background-size: 315px 250px; 
  background-position: -315px 0, 0 0, 0px 190px, 50px 195px; 
  animation: loading 1.5s infinite;
}

@keyframes loading {  
  to {
    background-position: 315px 0, 0 0, 0 190px, 50px 195px;
  }
}
</style>