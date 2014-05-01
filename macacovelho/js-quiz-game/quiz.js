var data = {};
var currentQuestion;
var interval;
var currentSecond;
var eliminatedQuestions = false;
var timerShowOptions;
var page = 0;
var syncronizeInc = 0;
var urlBaseBannerModal = "http://openx.macacovelho.com.br/www/delivery/afr.php?zoneid=";
var offsetZoneTop = 5;
var offsetZoneBottom = 17;

$(document).ready(function(){
    
    addEvents();
    
    setSelectedMenu();
});

function setSelectedMenu()
{
    var url = window.location.href;
    var currentPage = url.substr(url.lastIndexOf("/")+1, url.lastIndexOf("?") - url.lastIndexOf("/") - 1);
    $(".navegacao a[href="+currentPage+"]").addClass("ativo");
}

function checkLimitDay(event)
{    
    removeEvents();
    
    data = new Object();
    data.theme = $(this).find("span").html();
    data.themeId = $(this).find("span").attr("id");
    
    $.ajax({
        url: "users/checkLimitDay",
        data: {
            themeId: data.themeId
        },
        type: "POST",
        dataType: "json",
        success: function(msg)
        {
            if (msg)
            {
                checkLimitTheme(event);
            }
            else
            {
                data.msg = "Seu limite diário de tentativas foi atingido. Jogue novamente amanhã. Enquanto isso, acesse a nossa Fan Page e fique por dentro do Macaco Velho!";
                loadPageError();
            }
        }
    });
    
    event.stopImmediatePropagation();
}

function checkLimitTheme(event)
{    
    removeEvents();
    
    $.ajax({
        url: "users/checkLimitTheme",
        data: {
            themeId: data.themeId
        },
        type: "POST",
        dataType: "json",
        success: function(msg)
        {
            if (msg)
            {
                checkAcceptTerms(event);
            }
            else
            {
                data.msg = "Prezado usuário, você esgotou o banco de perguntas desse tema. Aguarde por novas perguntas ou escolha outro tema!";
                loadPageError();
            }
        }
    });
    
    event.stopImmediatePropagation();
}

function checkAcceptTerms(event)
{
    removeEvents();
    
    clearInterval(interval);
    
    $.ajax({
        url: "users/checkAcceptTerms",
        type: "POST",
        dataType: "json",
        success: function(msg)
        {
            if (msg)
            {
                loadPageVideo();
            }
            else
            {
                loadPageTerms();
            }
        }
    });
    
    event.stopImmediatePropagation();
}

function loadPageVideo()
{
    removeEvents();
    
    $("#container-modal-test").load("system/application/views/tests/video.php", data, onLoadPageVideo);
}

function onClickSkipVideo()
{
    initTest();
}

function onLoadPageVideo()
{
    openModal();
    
    addEvents();
}

function loadPageTerms()
{
    removeEvents();
    
    $("#container-modal-test").load("system/application/views/tests/terms.php", data, onLoadTerms);
}

function onLoadTerms()
{
    $(".btn-accept-terms").css("display", "none");    
    $(".btn-reject-terms").css("display", "none");
    
    openModal();
    
    showButtonsQuestion();
    
    addEvents();
}

function openModal()
{
    $("body").addClass("modal-aberto");

    $(".flash").hide();

    FB.Canvas.scrollTo(0,0);
    
    addEvents();
}

function onClickAcceptTerms(event)
{
    removeEvents();
    
    $.ajax({
        url: "users/acceptTerms",
        type: "POST",
        dataType: "json",
        success: function(msg)
        {
            if (msg)
            {
                initTest();
            }
        }
    });
    
    event.stopImmediatePropagation();
}

function onClickRejectTerms(event)
{
    $(".modal-fechar").click();
    
    event.stopImmediatePropagation();
    
    addEvents();    
}

function onClickCheckboxTerms(event)
{
    var isChecked = $("input[name=termos_uso]").attr("checked");
    var display = "none";
    
    if (isChecked)
    {
        display = "block";
    }
    
    $(".btn-accept-terms").css("display", display);    
    $(".btn-reject-terms").css("display", display);
    
    addEvents();
    
    event.stopImmediatePropagation();
}

function initTest()
{
    removeEvents();
    
    currentQuestion = 0;
    
    $.ajax({
        url:"login/getInfosLogged",
        type: "POST",
        dataType: "json",
        success:function(msg)
        {
            if (msg)
            {
                data.name = msg.name;
                data.id = msg.id;
                loadPage1();
            }
        }
    });
}

function startTest(event)
{    
    removeEvents();
    
    $.ajax({
        url: "tests/createAjax",
        data: {
            themeId:data.themeId
        },
        type: "POST",
        dataType: "json",
        success: function(msg)
        {
            if (msg)
            {
                data.testId = msg.testId;
                createQuestions();
            }
            else
            {
                data.msg = "Seu limite diário de 5 tentativas foi atingido. Jogue novamente amanhã. Enquanto isso, acesse a nossa Fan Page e fique por dentro do Macaco Velho!";
                loadPageError();
            }
        }
    });
    
    event.stopImmediatePropagation();
}

function loadPageError()
{
    removeEvents();
    
    $("#container-modal-test").load("system/application/views/tests/error.php", data, onLoadPageError);
}

function onLoadPageError()
{   
    openModal();
    
    $("#simplemodal-container a.modalCloseImg").css("display", "none");
}

function createQuestions()
{
    removeEvents();
    
    $.ajax({
        url:"testshasquestions/createAjax",
        data: {
            testId:data.testId
        },
        type: "POST",
        dataType: "json",
        success: function(msg)
        {
            if (msg)
            {
                loadPage2();
            }
        }
        
    });
}

function loadPage1(event)
{
    removeEvents();
    
    page = 1;
    
    $("#container-modal-test").load("system/application/views/tests/page1.php", data, onLoadPage1);
    
    if (event)
    {
        event.stopImmediatePropagation();
    }
}

function loadPage2(event)
{
    removeEvents();
    
    page = 2;
    
    $("#container-modal-test").load("system/application/views/tests/page2.php", data, onLoadPage2);
    
    if (event)
    {
        event.stopImmediatePropagation();
    }    
}

function loadPage3(event)
{
    removeEvents();
    
    page = 3;
    
    $("#container-modal-test").load("system/application/views/tests/page3.php", data, onLoadPage3);
    
    if (event)
    {
        event.stopImmediatePropagation();
    }
}

function onLoadPage1()
{
    openModal();
}

function onLoadPage2()
{
    openModal();

    hideItensQuestion();
    
    getNextQuestion();
}

function getNextQuestion()
{
    removeEvents();
    
    clearInterval(interval);
    
    clearCurrentQuestion();
    
    $.ajax({
        url: "testshasquestions/getNextQuestion",
        data: {
            testId:data.testId
        },
        type: "POST",
        dataType:"json",
        success:function(msg)
        {
                
            if (msg)
            {
                onGetNextQuestion(msg);
            }
            else
            {
                finishTest();
            }
        }
    });
}

function clearCurrentQuestion()
{
    $("#container-modal-test").find(".modal-pergunta").find("p:eq(0)").html("Carregando pergunta...");
    $("#container-modal-test").find(".modal-pergunta").find("strong:eq(0)").html("");
    
    $("#container-modal-test").find(".modal-pergunta").find("form").html("");
    
    hideTimer();
    
    hideButtonsQuestion();
}


function onGetNextQuestion(msg)
{
    currentQuestion++;
    
    data.questionId = msg.id;
    data.kindOfQuestion = msg.kindOfQuestion;
    
    showQuestion(msg);
}

function hideItensQuestion()
{
    $("#container-modal-test").find(".pergunta").find("form").animate({
        opacity:0
    }, 0);
    
    $("#container-modal-test").find(".estatistica").animate({
        opacity:0
    }, 0);
    
    $("#container-modal-test").find(".buttons").animate({
        opacity:0
    }, 0);
    
    addEvents();
}

function showItensQuestion()
{
    $("#container-modal-test").find(".pergunta").find("form").animate({
        opacity:1
    }, 0.5);
    
    $("#container-modal-test").find(".estatistica").animate({
        opacity:1
    }, 0.5);
    
    $("#container-modal-test").find(".buttons").animate({
        opacity:1
    }, 0.5);
    
    addEvents();
}

function showQuestion(infos)
{
    removeEvents();
    
    var title = infos.title;
    var testId = infos.testId;
    var id = infos.id;
    var kindOfQuestion = infos.kindOfQuestion;
    var maxPoints = infos.maxPoints;
    var totalEliminatedQuestions = infos.totalEliminatedQuestions;
    var totalSkipedQuestions = infos.totalSkipedQuestions;
    
    $("#container-modal-test").find(".topo").find("h3").html("Macaco Velho - Teste de " + data.theme);
    
    var preTitle = "";
    
    if (kindOfQuestion == 3)
    {
        preTitle = "Marque UMA ou DUAS respostas CORRETAS: ";
    }
    
    $("#container-modal-test").find(".modal-pergunta").find("strong:eq(0)").html(preTitle+title);
    
    $("#container-modal-test").find(".modal-pergunta").find("form").attr("id", id);
    $("#container-modal-test").find("p:eq(0)").html("Pergunta "+currentQuestion+" :: Valendo até "+maxPoints+" pontos.");
    
    if (kindOfQuestion == 3)
    {
        $(".eliminar").hide();
        $(".pular").hide();        
    }
    else
    {
        if (kindOfQuestion == 1 && totalEliminatedQuestions < 2 && data.themeId <= 5)
        {
            $(".eliminar").show();
        }
        else
        {
            $(".eliminar").hide();
        }

        if (totalSkipedQuestions < 2 && data.themeId <= 5)
        {
            $(".pular").show();
        }
        else
        {
            $(".pular").hide();
        }
    }
    
    hideTimer();
    
    timerShowOptions = setTimeout(function(){
        
        getOptionsCurrentQuestion();
     
    }, 3000);

    $(".modal-banner-pergunta").html($(".modal-banner-pergunta").html());

    // Atualizar banner
    var finalURLBannerModal = urlBaseBannerModal + (currentQuestion + offsetZoneTop);
    //$(".modal-header iframe").attr("src", finalURLBannerModal);

    var finalURLBannerModal = urlBaseBannerModal + (currentQuestion + offsetZoneBottom);
    //$(".modal-footer iframe").attr("src", finalURLBannerModal);
}

function getOptionsCurrentQuestion()
{
    removeEvents();
    
    $.ajax({
        url: "testshasquestions/getOptionsQuestion",
        type: "POST",
        dataType: "json",
        data: {
            testId: data.testId,
            questionId:data.questionId
        },
        success: function(msg)
        {
            if (msg)
            {       
                onGetOptionsCurrentQuestion(msg);
            }
        }
    });
}

function onGetOptionsCurrentQuestion(infos)
{
    var options = infos.options;
    eliminatedQuestions = false;
    
    var inputs = "";
    var i = 1;
    
    for (var index in options)
    {
        var option = options[index];
        var idOption = option.id;
        var titleOption = option.title;
        var typeInput = "radio";
        
        if (data.kindOfQuestion == 3)
        {
            typeInput = "checkbox";
        }
        
        inputs += "<label><input type='"+typeInput+"' name='resp' value='"+idOption+"' /> &nbsp;"+titleOption+"</label>";
        
        i++;
    }
    
    $("#container-modal-test").find(".modal-pergunta").find("form").html(inputs);
    
    showItensQuestion();
    
    showButtonsQuestion();

    startTimer();
    
    addEvents();
}

function hideButtonsQuestion()
{
    $(".modal-perguntas-botoes").hide();
}

function showButtonsQuestion()
{
    $(".modal-perguntas-botoes").show();
}

function startTimer()
{
    currentSecond = 20;
    
    clearInterval(interval);
    
    interval = setInterval(onIntervalTimer, 1000);
    
    showTimer();
}

function onLoadPage3()
{
    openModal();
}

function finishTest()
{
    removeEvents();
    
    clearInterval(interval);
    
    $("#container-modal-test").find(".pergunta").find(".maxPointsQuestion").find("strong").html("Aguarde enquanto estamos calculando sua pontuação...");
    $("#container-modal-test").find(".pergunta").find(".title").find("strong").html("");
    
    $.ajax({
        url: "testshasquestions/finishTest",
        data: {
            testId:data.testId,
            themeId:data.themeId
        },
        type: "POST",
        dataType:"json",
        success:function(msg)
        {
            if (msg)
            {                
                data.points = msg.points;
                data.correctQuestions = msg.correctQuestions;
                data.lastPositionRanking = msg.lastPositionRanking;
                data.newPositionRanking = msg.newPositionRanking;
                data.todayTests = msg.todayTests;
                data.limitTodayTests = msg.limitTodayTests;
                data.lastPoints = msg.lastPoints;
                data.nextAwards = msg.nextAwards;
                data.bestPoints = msg.bestPoints;
                
                loadPage3();
            }
        }
    });
}

function onCloseModal(event)
{    
    removeEvents();
    
    $("#container-modal-test").html("");

    $("body").removeClass("modal-aberto");

    $(".flash").show();
    
    window.location.href = window.location.href;
    
    clearInterval(interval);
    
    event.stopImmediatePropagation();
}

function addEvents()
{
    removeEvents();

    $('.modal-overlay').css({'background' : 'rgba(255,255,255,0.7)'});
    
    $(".go-to-page-1").click(loadPage1);
    
    $(".start-test").click(startTest);
    
    $(".go-to-page-2").click(loadPage2);
    
    $(".go-to-page-3").click(loadPage3);
    
    $(".modal-fechar").click(onCloseModal);
    
    $(".confirmar").click(onClickConfirmar);
    
    $(".pular").click(onClickPular);
    
    $(".eliminar").click(onClickEliminar);
    
    $(".btn-accept-terms").click(onClickAcceptTerms);
    
    $(".btn-reject-terms").click(onClickRejectTerms);
    
    $("input[name=termos_uso]").click(onClickCheckboxTerms);
    
    //$(".init-test").click(checkAcceptTerms);
    $(".init-test").click(checkLimitDay);
    
    $(".init-test").css("cursor", "pointer");
    
    $(".bt-singleOK").click(function(){
        $(".modal-fechar").click();
    });

    $(".skip-video").click(function(){
        onClickSkipVideo();
    });
    
    initTooltip();
}

function removeEvents()
{
    $(".go-to-page-1").off("click");
    
    $(".start-test").off("click");
    
    $(".go-to-page-2").off("click");
    
    $(".go-to-page-3").off("click");
    
    $(".modal-fechar").off("click");
    
    $(".confirmar").off("click");
    
    $(".pular").off("click");
    
    $(".eliminar").off("click");
    
    $(".btn-accept-terms").off("click");
    
    $(".btn-reject-terms").off("click");
    
    $("input[name=termos_uso]").off("click");
    
    $(".init-test").off("click");
    
    $(".bt-singleOK").off("click");

    $(".skip-video").off("click");
    
    initTooltip();
}

function goToPage(page, themeId)
{
    console.log("Page: " + page + ", themeId: " + themeId);
    
    if (window.location.href.indexOf("name") > -1)
    {
        var url = window.location.href;
        
        if (window.location.href.indexOf("page") > -1)
        {
            url = window.location.href.substr(0, window.location.href.indexOf("&page"));
        }
        
        window.location.href = url + "&page=" + page;
    }
    else
    {
        if (themeId <= 5)
        {
            window.location.href = "ranking/?page="+page;
        }
        else
        {
            window.location.href = "ranking/"+themeId+"/?page="+page;
        }
    }
}



function onClickEliminar(event)
{   
    if (!eliminatedQuestions)
    {
        if (eliminate)
        {
            eliminate.play();
        }
        
        removeEvents();
        
        var question = $("#container-modal-test").find("form").attr("id");
    
        $.ajax({
            url:"testshasquestions/getWrongQuestions",
            type: "POST",
            dataType: "json",
            data: {
                test:data.testId, 
                question:question,
                themeId: data.themeId
            },
            success:function(msg)
            {
                if (msg)
                {
                    onGetWrongQuestions(msg);
                }
            }
        });
    }
    
    event.stopImmediatePropagation();
}

function onGetWrongQuestions(data)
{
    eliminatedQuestions = true;
                    
    for (var index in data)
    {
        var option = data[index];
        var input = $("#container-modal-test").find("form").find("input[value="+option+"]");
        $(input).attr("disabled", "disabled");
        $(input).parent().animate({
            opacity:0.3
        }, 0);
    }

    $(".eliminar").hide();
    
    addEvents();    
}

function onClickConfirmar(event)
{
    removeEvents();
    
    var options = new Array();
    
    $.each($("#container-modal-test").find("form").find("input:checked"), function(index, element){
        options.push($(element).val());
    });
    
    //var option = $("#container-modal-test").find("form").find("input:checked").val();
    var option = options.toString();
    var question = $("#container-modal-test").find("form").attr("id");
    
    $.ajax({
        url: "testshasquestions/setQuestion",
        type: "POST",
        dataType: "json",
        data: {
            question: question, 
            option: option,
            test: data.testId
        },
        success:function(msg)
        {
            if (msg.success)
            {
                if (msg.status == 1)
                {
                    if (correct)
                    {
                        correct.play();
                    }
                }
                else
                {
                    if (wrong)
                    {
                        wrong.play();
                    }
                }
                
                getNextQuestion();
            }
        }
    });
    
    if (event)
    {
        event.stopImmediatePropagation();
    }
}

function onClickPular(event)
{
    if (skip)
    {
        skip.play();
    }
    
    removeEvents();
    
    $.ajax({
        url:"testshasquestions/skipQuestion",
        type: "POST",
        dataType: "json",
        data: {
            test:data.testId, 
            question:data.questionId,
            themeId: data.themeId
        },
        success:function(msg)
        {
            if (msg)
            {
                currentQuestion--;
                
                getNextQuestion();
            }
        }
    });
    
    event.stopImmediatePropagation();
}

function onIntervalTimer()
{
    if (currentSecond <= 0)
    {
        onClickConfirmar();
    }
    else
    {
        currentSecond--;
        showTimer();
        syncronizeTimer();
    }
}

function syncronizeTimer()
{
    if (syncronizeInc == 3)
    {
        syncronizeInc = 0;
    
        $.ajax({
            url:"testshasquestions/getTimeRemaing",
            type: "POST",
            dataType: "json",
            data: {
                test:data.testId, 
                question:data.questionId
            },
            success:function(msg)
            {
                if (msg)
                {
                    currentSecond = msg;
                    showTimer();
                }
            }
        });
    }
    
    syncronizeInc++;
}

function showTimer()
{
    $(".tempo span").html(currentSecond);
    
    $(".tempo").show();
    
    var color = "red";
    
    if (currentSecond >= 15)
    {
        color = "green";
    }
    else
    {
        if (currentSecond >= 10)
        {
            color = "orange";
        }
    }
    
    $(".tempo span").css("background-color", color);
}

function hideTimer()
{
    $(".tempo span").html("");
    
    $(".tempo").hide();
}